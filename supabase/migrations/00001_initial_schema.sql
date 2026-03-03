-- =============================================================================
-- Wordlary - Vocabulary Learning App Schema
-- Supabase PostgreSQL
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. UTILITY FUNCTIONS
-- ---------------------------------------------------------------------------

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-create a profile row when a new auth.users row is inserted
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 2. TABLES
-- ---------------------------------------------------------------------------

-- profiles ----------------------------------------------------------------
CREATE TABLE public.profiles (
  id                    UUID        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name          TEXT,
  onboarding_completed  BOOLEAN     NOT NULL DEFAULT false,
  current_streak        INTEGER     NOT NULL DEFAULT 0,
  longest_streak        INTEGER     NOT NULL DEFAULT 0,
  last_session_date     DATE,
  daily_word_count      INTEGER     NOT NULL DEFAULT 10,
  preferred_difficulty  TEXT        NOT NULL DEFAULT 'intermediate'
                        CHECK (preferred_difficulty IN ('beginner', 'intermediate', 'advanced')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Extended profile data for each authenticated user.';

-- interests ---------------------------------------------------------------
CREATE TABLE public.interests (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        UNIQUE NOT NULL,
  emoji       TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.interests IS 'Predefined list of topic interests users can choose from.';

-- user_interests ----------------------------------------------------------
CREATE TABLE public.user_interests (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  interest_id  UUID        NOT NULL REFERENCES public.interests (id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, interest_id)
);

COMMENT ON TABLE public.user_interests IS 'Junction table linking users to their chosen interests.';

-- daily_sessions ----------------------------------------------------------
CREATE TABLE public.daily_sessions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  session_date     DATE        NOT NULL DEFAULT CURRENT_DATE,
  word_count       INTEGER     NOT NULL DEFAULT 10,
  words_completed  INTEGER     NOT NULL DEFAULT 0,
  is_completed     BOOLEAN     NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, session_date)
);

COMMENT ON TABLE public.daily_sessions IS 'One row per user per day tracking session progress.';

-- learned_words -----------------------------------------------------------
CREATE TABLE public.learned_words (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  session_id       UUID        NOT NULL REFERENCES public.daily_sessions (id) ON DELETE CASCADE,
  word             TEXT        NOT NULL,
  ipa              TEXT,
  example_sentence TEXT,
  word_es          TEXT,
  sentence_es      TEXT,
  interest_slug    TEXT,
  is_learned       BOOLEAN     NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique index on (user_id, lowercase word) to prevent duplicate words per user
CREATE UNIQUE INDEX idx_learned_words_user_word
  ON public.learned_words (user_id, LOWER(word));

COMMENT ON TABLE public.learned_words IS 'Individual words presented to a user, linked to the session they appeared in.';

-- review_schedule ---------------------------------------------------------
CREATE TABLE public.review_schedule (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID          NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  word_id            UUID          NOT NULL REFERENCES public.learned_words (id) ON DELETE CASCADE UNIQUE,
  repetition_number  INTEGER       NOT NULL DEFAULT 0,
  ease_factor        NUMERIC(4,2)  NOT NULL DEFAULT 2.5,
  interval_days      INTEGER       NOT NULL DEFAULT 0,
  next_review_date   DATE          NOT NULL DEFAULT CURRENT_DATE + 1,
  last_reviewed_at   TIMESTAMPTZ,
  total_reviews      INTEGER       NOT NULL DEFAULT 0,
  correct_reviews    INTEGER       NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.review_schedule IS 'Spaced-repetition schedule for each learned word.';

-- ---------------------------------------------------------------------------
-- 3. INDEXES (beyond the unique constraints above)
-- ---------------------------------------------------------------------------

CREATE INDEX idx_user_interests_user_id    ON public.user_interests (user_id);
CREATE INDEX idx_daily_sessions_user_id    ON public.daily_sessions (user_id);
CREATE INDEX idx_learned_words_user_id     ON public.learned_words (user_id);
CREATE INDEX idx_learned_words_session_id  ON public.learned_words (session_id);
CREATE INDEX idx_review_schedule_user_id   ON public.review_schedule (user_id);
CREATE INDEX idx_review_schedule_next_date ON public.review_schedule (user_id, next_review_date);

-- ---------------------------------------------------------------------------
-- 4. TRIGGERS
-- ---------------------------------------------------------------------------

-- Auto-create profile on sign-up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- updated_at triggers
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_daily_sessions_updated_at
  BEFORE UPDATE ON public.daily_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_learned_words_updated_at
  BEFORE UPDATE ON public.learned_words
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_review_schedule_updated_at
  BEFORE UPDATE ON public.review_schedule
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

-- Enable RLS on every table
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learned_words   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_schedule ENABLE ROW LEVEL SECURITY;

-- profiles ----------------------------------------------------------------

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- interests (read-only for all authenticated users) -----------------------

CREATE POLICY "Authenticated users can view all interests"
  ON public.interests FOR SELECT
  USING (auth.role() = 'authenticated');

-- user_interests ----------------------------------------------------------

CREATE POLICY "Users can view their own interests"
  ON public.user_interests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interests"
  ON public.user_interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interests"
  ON public.user_interests FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interests"
  ON public.user_interests FOR DELETE
  USING (auth.uid() = user_id);

-- daily_sessions ----------------------------------------------------------

CREATE POLICY "Users can view their own sessions"
  ON public.daily_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.daily_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.daily_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.daily_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- learned_words -----------------------------------------------------------

CREATE POLICY "Users can view their own words"
  ON public.learned_words FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own words"
  ON public.learned_words FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own words"
  ON public.learned_words FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own words"
  ON public.learned_words FOR DELETE
  USING (auth.uid() = user_id);

-- review_schedule ---------------------------------------------------------

CREATE POLICY "Users can view their own review schedule"
  ON public.review_schedule FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own review schedule"
  ON public.review_schedule FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own review schedule"
  ON public.review_schedule FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own review schedule"
  ON public.review_schedule FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 6. HELPER FUNCTIONS
-- ---------------------------------------------------------------------------

-- Returns an array of lowercase words the user has already learned
CREATE OR REPLACE FUNCTION public.get_user_word_list(p_user_id UUID)
RETURNS TEXT[] AS $$
  SELECT COALESCE(
    array_agg(LOWER(lw.word) ORDER BY lw.created_at),
    '{}'::TEXT[]
  )
  FROM public.learned_words lw
  WHERE lw.user_id = p_user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Returns an array of interest slugs for the given user
CREATE OR REPLACE FUNCTION public.get_user_interest_slugs(p_user_id UUID)
RETURNS TEXT[] AS $$
  SELECT COALESCE(
    array_agg(i.slug ORDER BY i.name),
    '{}'::TEXT[]
  )
  FROM public.user_interests ui
  JOIN public.interests i ON i.id = ui.interest_id
  WHERE ui.user_id = p_user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 7. SEED DATA - Interests
-- ---------------------------------------------------------------------------

INSERT INTO public.interests (name, slug, emoji) VALUES
  ('Technology',    'technology',    '💻'),
  ('Sports',        'sports',        '⚽'),
  ('Cooking',       'cooking',       '🍳'),
  ('Music',         'music',         '🎵'),
  ('Travel',        'travel',        '✈️'),
  ('Science',       'science',       '🔬'),
  ('Business',      'business',      '💼'),
  ('Health',        'health',        '🏥'),
  ('Entertainment', 'entertainment', '🎬'),
  ('Nature',        'nature',        '🌿'),
  ('Art',           'art',           '🎨'),
  ('Literature',    'literature',    '📚'),
  ('Fitness',       'fitness',       '🏋️'),
  ('Finance',       'finance',       '💰'),
  ('Programming',   'programming',   '💻'),
  ('History',       'history',       '📜'),
  ('Geography',     'geography',     '🌍'),
  ('Art',           'art',           '🎨'),
  ('Literature',    'literature',    '📚'),
  ('Music',         'music',         '🎵'),
  ('Movies',        'movies',        '🎥'),
  ('TV',            'tv',            '📺'),
  ('Books',         'books',         '📚'),
ON CONFLICT (slug) DO NOTHING;
