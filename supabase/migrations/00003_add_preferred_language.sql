-- Add preferred_language column to profiles
-- Used by the proxy to sync the NEXT_LOCALE cookie and by POST /api/locale

ALTER TABLE public.profiles
  ADD COLUMN preferred_language TEXT NOT NULL DEFAULT 'es'
  CHECK (preferred_language IN ('es', 'en'));
