-- =============================================================================
-- VocabFlow - Add timezone column to profiles
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN timezone TEXT NOT NULL DEFAULT 'UTC';
