import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.PLAYWRIGHT_EMAIL;
const adminPassword = process.env.PLAYWRIGHT_PASSWORD;

if (!supabaseUrl || !serviceRoleKey || !adminEmail || !adminPassword) {
  throw new Error('Missing local Supabase or Playwright auth environment variables');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const isRetryableError = (error) => {
  if (!error) return false;
  const status = typeof error.status === 'number' ? error.status : null;
  return status === null || status >= 500;
};

async function withRetry(task, label, attempts = 8) {
  let lastError = null;

  for (let index = 0; index < attempts; index += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error) || index === attempts - 1) {
        throw error;
      }

      await sleep(1000 * (index + 1));
    }
  }

  throw lastError ?? new Error(`${label} failed`);
}

const { data: listedUsers, error: listError } = await withRetry(
  () => supabase.auth.admin.listUsers(),
  'list users'
);

if (listError) {
  throw listError;
}

let adminUser = listedUsers.users.find((user) => user.email === adminEmail) ?? null;

if (adminUser) {
  const { data, error } = await withRetry(
    () =>
      supabase.auth.admin.updateUserById(adminUser.id, {
        password: adminPassword,
        email_confirm: true,
      }),
    'update user'
  );

  if (error) {
    throw error;
  }

  adminUser = data.user;
} else {
  const { data, error } = await withRetry(
    () =>
      supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
      }),
    'create user'
  );

  if (error) {
    throw error;
  }

  adminUser = data.user;
}

if (!adminUser?.id) {
  throw new Error('Failed to provision local admin user');
}

const { data: tenant, error: tenantError } = await withRetry(
  () =>
    supabase
      .from('tenants')
      .select('id')
      .eq('slug', 'demo-clinic')
      .single(),
  'load demo tenant'
);

if (tenantError || !tenant) {
  throw tenantError ?? new Error('demo-clinic tenant not found');
}

const { data: existingMembership, error: membershipLookupError } = await supabase
  .from('tenant_users')
  .select('id')
  .eq('tenant_id', tenant.id)
  .eq('user_id', adminUser.id)
  .maybeSingle();

if (membershipLookupError) {
  throw membershipLookupError;
}

if (!existingMembership) {
  const { error: insertMembershipError } = await supabase.from('tenant_users').insert({
    tenant_id: tenant.id,
    user_id: adminUser.id,
    role: 'admin',
  });

  if (insertMembershipError) {
    throw insertMembershipError;
  }
}
