'use server';

import { z } from 'zod';
import { getServerUser } from '@repo/web/src/lib/auth/server-user';
import { createServiceRoleClient } from '@repo/web/src/lib/supabase/service-role';
import { getAppUrl } from '@repo/web/src/lib/app-url';
import {
  buildManageUrl,
  generateManageToken,
  hashManageToken,
} from '@repo/web/src/lib/booking/manage-token';
import {
  attachManageLinkToOutbox,
  sendManageLinkEmail,
} from '@repo/web/src/lib/booking/manage-link-email';

const bookingSchema = z.object({
  serviceId: z.string().uuid(),
  staffId: z.string().uuid().nullable().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  fullName: z.string().min(2, 'Zadajte celé meno (min. 2 znaky)'),
  email: z.string().email('Zadajte platnú e-mailovú adresu'),
  phone: z.string().min(6, 'Zadajte platné telefónne číslo'),
  note: z.string().max(500).optional(),
});

export type BookingFormData = z.infer<typeof bookingSchema>;

export type SubmitBookingResult =
  | { ok: true; bookingId: string; rawToken: string; manageUrl: string }
  | { ok: false; error: string; message: string };

export async function submitBookingAction(
  tenantSlug: string,
  rawFormData: BookingFormData,
): Promise<SubmitBookingResult> {
  const parsed = bookingSchema.safeParse(rawFormData);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Neplatné vstupné údaje.';
    return { ok: false, error: 'validation_error', message: firstError };
  }

  const { serviceId, staffId, startTime, endTime, fullName, email, phone, note } = parsed.data;

  const supabaseAdmin = createServiceRoleClient();

  // 1. Resolve tenant
  const { data: tenant, error: tenantError } = await supabaseAdmin
    .from('tenants')
    .select('id, name, slug, timezone')
    .eq('slug', tenantSlug)
    .maybeSingle();

  if (tenantError || !tenant) {
    return { ok: false, error: 'tenant_not_found', message: 'Prevádzka nebola nájdená.' };
  }

  // 2. Resolve or create user (Guest Checkout Support)
  let targetUserId: string;
  const existingSessionUser = await getServerUser();

  if (existingSessionUser) {
    targetUserId = existingSessionUser.id;
  } else {
    // Guest flow: check if user with email already exists in auth.users
    const { data: createdUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone },
    });

    if (createUserError) {
      // If user already exists, find by email
      const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
      const matched = listData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

      if (matched) {
        targetUserId = matched.id;
      } else {
        return {
          ok: false,
          error: 'user_creation_failed',
          message: 'Nepodarilo sa vytvoriť klientsky profil pre rezerváciu.',
        };
      }
    } else {
      targetUserId = createdUser.user.id;
    }
  }

  // 3. Resolve staff ID if "anyone" (staffId is null)
  let resolvedStaffId = staffId ?? null;

  if (!resolvedStaffId) {
    const startRange = new Date(startTime).toISOString();
    const endRange = new Date(endTime).toISOString();

    const { data: availableSlots, error: slotsError } = await supabaseAdmin.rpc('get_available_slots', {
      p_tenant_id: tenant.id,
      p_service_id: serviceId,
      p_start_range: startRange,
      p_end_range: endRange,
      p_staff_id: null,
    });

    if (slotsError || !availableSlots || availableSlots.length === 0) {
      return {
        ok: false,
        error: 'slot_taken',
        message: 'Tento čas bol práve obsadený, vyberte si prosím iný.',
      };
    }

    // Find slot matching the requested startTime
    const matchedSlot = availableSlots.find(
      (s) => s.slot_start === startTime,
    );

    if (!matchedSlot) {
      return {
        ok: false,
        error: 'slot_taken',
        message: 'Tento čas už nie je dostupný, vyberte si prosím iný.',
      };
    }

    resolvedStaffId = matchedSlot.staff_id;
  }

  // 4. Atomic Booking Insertion (Guarded by EXCLUDE constraint no_overlapping_staff_bookings)
  const { data: insertedBooking, error: insertError } = await supabaseAdmin
    .from('bookings')
    .insert({
      tenant_id: tenant.id,
      user_id: targetUserId,
      service_id: serviceId,
      staff_id: resolvedStaffId,
      start_time: startTime,
      end_time: endTime,
      status: 'confirmed',
    })
    .select('id')
    .single();

  if (insertError || !insertedBooking) {
    // Code 23P01 or exclusion_violation
    if (insertError?.code === '23P01' || insertError?.message?.includes('exclusion')) {
      return {
        ok: false,
        error: 'slot_taken',
        message: 'Tento čas bol práve obsadený iným klientom. Vyberte si prosím iný slot.',
      };
    }

    console.error('[submitBookingAction] insert error:', insertError);
    return {
      ok: false,
      error: 'database_error',
      message: 'Rezerváciu sa nepodarilo uložiť. Skúste to znova.',
    };
  }

  const bookingId = insertedBooking.id;

  // 5. Issue Self-Service Management Token (BK-4)
  const rawToken = generateManageToken();
  const tokenHash = hashManageToken(rawToken);
  const expiresAt = new Date(new Date(endTime).getTime() + 30 * 86_400_000).toISOString();

  await supabaseAdmin.from('booking_manage_tokens').insert({
    booking_id: bookingId,
    tenant_id: tenant.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
    created_by: targetUserId,
  });

  // Log audit event
  await supabaseAdmin.from('booking_audit_events').insert({
    tenant_id: tenant.id,
    booking_id: bookingId,
    actor: 'customer',
    action: 'token_issued',
    details: { expiresAt, note: note ? note.trim() : null },
  });

  const manageUrl = buildManageUrl(getAppUrl(), tenantSlug, rawToken);

  // 6. Enrich transactional outbox with manageUrl
  const attachedToOutbox = await attachManageLinkToOutbox(bookingId, manageUrl);

  // If not handled by outbox worker yet, send direct confirmation email
  if (!attachedToOutbox) {
    const { data: serviceData } = await supabaseAdmin
      .from('services')
      .select('name')
      .eq('id', serviceId)
      .maybeSingle();

    await sendManageLinkEmail({
      to: email,
      tenantName: tenant.name,
      serviceName: serviceData?.name ?? 'Služba',
      startTime,
      manageUrl,
    }).catch((err) => {
      console.warn('[submitBookingAction] Direct email fallback warning:', err);
    });
  }

  return {
    ok: true,
    bookingId,
    rawToken,
    manageUrl,
  };
}
