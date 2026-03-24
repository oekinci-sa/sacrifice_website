-- offline durumu + heartbeat stale → offline + trigger güncellemeleri
-- (Supabase'de apply_migration ile uygulanmıştır; repo senkronu)

ALTER TABLE reservation_transactions DROP CONSTRAINT IF EXISTS reservation_transactions_status_check;
ALTER TABLE reservation_transactions ADD CONSTRAINT reservation_transactions_status_check
  CHECK (status IN ('active', 'completed', 'canceled', 'timed_out', 'expired', 'offline'));

CREATE OR REPLACE FUNCTION public.expire_stale_reservations()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE reservation_transactions
  SET status = 'offline'
  WHERE status = 'active'
    AND last_heartbeat_at IS NOT NULL
    AND last_heartbeat_at < now() - interval '30 seconds';
END;
$$;

-- handle_reservation_deactivation ve set_reservation_completed_at: bkz.
-- .project-architecture/db/tables/reservation_transactions/functions_and_triggers/
