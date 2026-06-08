-- Vincula eventos da agenda preventiva a ocorrências disciplinares quando aplicável.
-- Campos opcionais para manter compatibilidade com eventos preventivos manuais.

ALTER TABLE agenda_preventiva
  ADD COLUMN IF NOT EXISTS occurrence_id TEXT,
  ADD COLUMN IF NOT EXISTS student_id TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

UPDATE agenda_preventiva
SET metadata = '{}'
WHERE metadata IS NULL;

CREATE INDEX IF NOT EXISTS idx_agenda_preventiva_school_occurrence_source
  ON agenda_preventiva (school_id, occurrence_id, source)
  WHERE occurrence_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agenda_preventiva_school_student
  ON agenda_preventiva (school_id, student_id)
  WHERE student_id IS NOT NULL;
