-- =============================================================================
-- VocabFlow - Word Bank (platform-level shared vocabulary)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. TABLE
-- ---------------------------------------------------------------------------

CREATE TABLE public.word_bank (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  word              TEXT        NOT NULL,
  ipa               TEXT        NOT NULL,
  example_sentence  TEXT        NOT NULL,
  word_es           TEXT        NOT NULL,
  sentence_es       TEXT        NOT NULL,
  interest_slug     TEXT        NOT NULL,
  difficulty_level  TEXT        NOT NULL
                    CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One entry per word (case-insensitive)
CREATE UNIQUE INDEX idx_word_bank_unique_word
  ON public.word_bank (LOWER(word));

-- Index for the primary query pattern: filter by interest + difficulty
CREATE INDEX idx_word_bank_interest_difficulty
  ON public.word_bank (interest_slug, difficulty_level);

COMMENT ON TABLE public.word_bank
  IS 'Platform-level shared vocabulary bank. Grows organically via dual-write from Gemini generations.';

-- ---------------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

ALTER TABLE public.word_bank ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "Authenticated users can read word bank"
  ON public.word_bank FOR SELECT
  USING (auth.role() = 'authenticated');

-- All authenticated users can insert (dual-write from API routes uses user client)
CREATE POLICY "Authenticated users can insert into word bank"
  ON public.word_bank FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- 3. HELPER FUNCTION - Fetch words from bank excluding known words
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_words_from_bank(
  p_interest_slugs TEXT[],
  p_difficulty     TEXT,
  p_exclude_words  TEXT[],
  p_limit          INTEGER
)
RETURNS SETOF public.word_bank AS $$
  SELECT *
  FROM public.word_bank
  WHERE interest_slug = ANY(p_interest_slugs)
    AND difficulty_level = p_difficulty
    AND LOWER(word) <> ALL(p_exclude_words)
  ORDER BY random()
  LIMIT p_limit;
$$ LANGUAGE sql STABLE SECURITY DEFINER
   SET search_path = public;

-- ---------------------------------------------------------------------------
-- 4. HELPER FUNCTION - Bulk insert into word bank (handles expression index)
-- ---------------------------------------------------------------------------

-- PostgREST upsert cannot target expression-based unique indexes like
-- LOWER(word), so we use an RPC function with raw ON CONFLICT syntax.
CREATE OR REPLACE FUNCTION public.word_bank_bulk_insert(p_words JSONB)
RETURNS void AS $$
BEGIN
  INSERT INTO public.word_bank (word, ipa, example_sentence, word_es, sentence_es, interest_slug, difficulty_level)
  SELECT
    (elem->>'word')::TEXT,
    (elem->>'ipa')::TEXT,
    (elem->>'example_sentence')::TEXT,
    (elem->>'word_es')::TEXT,
    (elem->>'sentence_es')::TEXT,
    (elem->>'interest_slug')::TEXT,
    (elem->>'difficulty_level')::TEXT
  FROM jsonb_array_elements(p_words) AS elem
  ON CONFLICT (LOWER(word)) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;
