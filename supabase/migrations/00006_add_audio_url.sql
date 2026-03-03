-- Add audio_url column to learned_words for caching pronunciation audio URLs
-- from the Free Dictionary API. NULL = not yet fetched. Client falls back to
-- Web Speech API when no URL is available.

ALTER TABLE public.learned_words
  ADD COLUMN audio_url TEXT;
