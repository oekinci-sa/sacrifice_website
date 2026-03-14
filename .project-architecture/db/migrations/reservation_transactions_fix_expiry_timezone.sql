-- Fix timezone-safe reservation expiry comparison.
-- expires_at is stored as TIMESTAMPTZ in UTC, so compare with now().

CREATE OR REPLACE FUNCTION public.check_expires_at_field()
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT *
        FROM reservation_transactions
        WHERE status = 'active'
          AND expires_at < now()
    LOOP
        UPDATE reservation_transactions
        SET status = 'expired'
        WHERE transaction_id = rec.transaction_id;
    END LOOP;
END;
$function$;
