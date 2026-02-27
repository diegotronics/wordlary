-- Fix: set immutable search_path on all functions to resolve
-- Supabase linter warning "function_search_path_mutable"

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.get_user_word_list(p_user_id UUID)
RETURNS TEXT[] AS $$
  SELECT COALESCE(
    array_agg(LOWER(lw.word) ORDER BY lw.created_at),
    '{}'::TEXT[]
  )
  FROM public.learned_words lw
  WHERE lw.user_id = p_user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.get_user_interest_slugs(p_user_id UUID)
RETURNS TEXT[] AS $$
  SELECT COALESCE(
    array_agg(i.slug ORDER BY i.name),
    '{}'::TEXT[]
  )
  FROM public.user_interests ui
  JOIN public.interests i ON i.id = ui.interest_id
  WHERE ui.user_id = p_user_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';
