-- Bana haber ver taleplerinde e-posta (isteğe bağlı); mail işlemleri listesi için.
ALTER TABLE reminder_requests
  ADD COLUMN IF NOT EXISTS email TEXT;

COMMENT ON COLUMN reminder_requests.email IS 'İsteğe bağlı e-posta; mail gönderim listesinde kullanılır.';
