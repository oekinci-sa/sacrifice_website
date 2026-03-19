-- Realtime kapatılacak tablolar (uygulama subscribe etmiyor)
ALTER PUBLICATION supabase_realtime DROP TABLE change_logs;
ALTER PUBLICATION supabase_realtime DROP TABLE failed_reservation_transactions_logs;
ALTER PUBLICATION supabase_realtime DROP TABLE users;
