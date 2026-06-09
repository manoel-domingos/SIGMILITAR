-- Adiciona colunas para OAuth Google Drive por escola.
-- O refresh_token é usado para autenticar operações no Drive como o gestor
-- da escola (resolve o 403 storageQuotaExceeded da service account).
ALTER TABLE public.school_settings
  ADD COLUMN IF NOT EXISTS google_oauth_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS google_oauth_email        TEXT,
  ADD COLUMN IF NOT EXISTS google_oauth_connected_at TIMESTAMPTZ;
