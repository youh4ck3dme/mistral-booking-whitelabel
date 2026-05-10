CREATE TABLE IF NOT EXISTS notification_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL CHECK (
    notification_type IN (
      'booking_confirmation',
      'booking_reminder',
      'booking_cancellation',
      'booking_update'
    )
  ),
  channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'push', 'sms')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  recipient_email TEXT NOT NULL,
  subject TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  idempotency_key TEXT NOT NULL UNIQUE,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attempt_count INT NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  provider_message_id TEXT,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_notification_deliveries_updated_at
BEFORE UPDATE ON notification_deliveries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status_schedule
  ON notification_deliveries(status, scheduled_for, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_booking
  ON notification_deliveries(booking_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_tenant_status
  ON notification_deliveries(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_user
  ON notification_deliveries(user_id, status);

ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION build_notification_idempotency_key(
  p_booking_id UUID,
  p_notification_type TEXT,
  p_scheduled_for TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_notification_type = 'booking_reminder' THEN
    RETURN CONCAT(
      p_booking_id::TEXT,
      ':',
      p_notification_type,
      ':',
      TO_CHAR(DATE_TRUNC('minute', COALESCE(p_scheduled_for, NOW()) AT TIME ZONE 'UTC'), 'YYYYMMDDHH24MI')
    );
  END IF;

  RETURN CONCAT(p_booking_id::TEXT, ':', p_notification_type);
END;
$$;

CREATE OR REPLACE FUNCTION queue_booking_notification(
  p_booking_id UUID,
  p_notification_type TEXT,
  p_scheduled_for TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking RECORD;
  v_recipient_email TEXT;
  v_idempotency_key TEXT;
  v_delivery_id UUID;
  v_scheduled_for TIMESTAMPTZ := COALESCE(p_scheduled_for, NOW());
BEGIN
  IF p_notification_type NOT IN (
    'booking_confirmation',
    'booking_reminder',
    'booking_cancellation',
    'booking_update'
  ) THEN
    RAISE EXCEPTION 'Unsupported notification type: %', p_notification_type;
  END IF;

  SELECT
    bookings.id,
    bookings.tenant_id,
    bookings.user_id,
    bookings.service_id,
    bookings.start_time,
    bookings.end_time,
    bookings.status,
    services.name AS service_name,
    tenants.name AS tenant_name
  INTO v_booking
  FROM bookings
  JOIN services ON services.id = bookings.service_id
  JOIN tenants ON tenants.id = bookings.tenant_id
  WHERE bookings.id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking % was not found for notification queueing', p_booking_id;
  END IF;

  SELECT auth.users.email
  INTO v_recipient_email
  FROM auth.users
  WHERE auth.users.id = v_booking.user_id;

  IF v_recipient_email IS NULL THEN
    RAISE EXCEPTION 'Booking % has no recipient email', p_booking_id;
  END IF;

  v_idempotency_key := build_notification_idempotency_key(
    p_booking_id,
    p_notification_type,
    v_scheduled_for
  );

  INSERT INTO notification_deliveries (
    tenant_id,
    booking_id,
    user_id,
    notification_type,
    channel,
    status,
    recipient_email,
    subject,
    payload,
    idempotency_key,
    scheduled_for
  )
  VALUES (
    v_booking.tenant_id,
    v_booking.id,
    v_booking.user_id,
    p_notification_type,
    'email',
    'pending',
    v_recipient_email,
    NULL,
    jsonb_build_object(
      'tenantName', v_booking.tenant_name,
      'serviceName', v_booking.service_name,
      'startTime', v_booking.start_time,
      'endTime', v_booking.end_time,
      'status', v_booking.status
    ),
    v_idempotency_key,
    v_scheduled_for
  )
  ON CONFLICT (idempotency_key) DO UPDATE
    SET scheduled_for = LEAST(notification_deliveries.scheduled_for, EXCLUDED.scheduled_for)
  RETURNING id INTO v_delivery_id;

  RETURN v_delivery_id;
END;
$$;

CREATE OR REPLACE FUNCTION schedule_booking_reminders(
  p_reminder_lead_time INTERVAL DEFAULT INTERVAL '24 hours',
  p_schedule_window INTERVAL DEFAULT INTERVAL '1 hour'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inserted INTEGER := 0;
BEGIN
  INSERT INTO notification_deliveries (
    tenant_id,
    booking_id,
    user_id,
    notification_type,
    channel,
    status,
    recipient_email,
    payload,
    idempotency_key,
    scheduled_for
  )
  SELECT
    bookings.tenant_id,
    bookings.id,
    bookings.user_id,
    'booking_reminder',
    'email',
    'pending',
    auth.users.email,
    jsonb_build_object(
      'tenantName', tenants.name,
      'serviceName', services.name,
      'startTime', bookings.start_time,
      'endTime', bookings.end_time,
      'status', bookings.status
    ),
    build_notification_idempotency_key(
      bookings.id,
      'booking_reminder',
      DATE_TRUNC('minute', bookings.start_time - p_reminder_lead_time)
    ),
    NOW()
  FROM bookings
  JOIN services ON services.id = bookings.service_id
  JOIN tenants ON tenants.id = bookings.tenant_id
  JOIN auth.users ON auth.users.id = bookings.user_id
  WHERE bookings.status = 'confirmed'
    AND bookings.start_time >= NOW() + p_reminder_lead_time
    AND bookings.start_time < NOW() + p_reminder_lead_time + p_schedule_window
    AND auth.users.email IS NOT NULL
  ON CONFLICT (idempotency_key) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted;
END;
$$;

CREATE OR REPLACE FUNCTION claim_notification_deliveries(
  p_limit INT DEFAULT 20,
  p_booking_id UUID DEFAULT NULL
)
RETURNS SETOF notification_deliveries
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH due_deliveries AS (
    SELECT notification_deliveries.id
    FROM notification_deliveries
    WHERE notification_deliveries.status = 'pending'
      AND notification_deliveries.scheduled_for <= NOW()
      AND (p_booking_id IS NULL OR notification_deliveries.booking_id = p_booking_id)
    ORDER BY notification_deliveries.scheduled_for ASC, notification_deliveries.created_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  ),
  updated_deliveries AS (
    UPDATE notification_deliveries
    SET
      status = 'processing',
      attempt_count = notification_deliveries.attempt_count + 1,
      updated_at = NOW()
    FROM due_deliveries
    WHERE notification_deliveries.id = due_deliveries.id
    RETURNING notification_deliveries.*
  )
  SELECT * FROM updated_deliveries;
END;
$$;

CREATE OR REPLACE FUNCTION sync_booking_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'confirmed' THEN
      PERFORM queue_booking_notification(NEW.id, 'booking_confirmation', NOW());
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'cancelled' THEN
      PERFORM queue_booking_notification(NEW.id, 'booking_cancellation', NOW());
      RETURN NEW;
    END IF;

    IF NEW.status = 'confirmed' THEN
      PERFORM queue_booking_notification(NEW.id, 'booking_confirmation', NOW());
    END IF;
  END IF;

  IF
    NEW.status != 'cancelled'
    AND (
      NEW.start_time IS DISTINCT FROM OLD.start_time
      OR NEW.end_time IS DISTINCT FROM OLD.end_time
      OR NEW.service_id IS DISTINCT FROM OLD.service_id
    )
  THEN
    PERFORM queue_booking_notification(NEW.id, 'booking_update', NOW());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_notification_sync ON bookings;

CREATE TRIGGER bookings_notification_sync
AFTER INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION sync_booking_notifications();

CREATE OR REPLACE FUNCTION send_booking_email(
  p_booking_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM queue_booking_notification(p_booking_id, 'booking_confirmation', NOW());
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION send_reminders()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM schedule_booking_reminders();
END;
$$;
