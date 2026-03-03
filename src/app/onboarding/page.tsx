'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  LogOut,
  BookOpen,
  GraduationCap,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { createBrowserClient } from '@supabase/ssr'
import type { ReactNode } from 'react'
import { MIN_INTERESTS, MAX_INTERESTS, RELATED_INTERESTS } from '@/lib/constants'

const TOTAL_STEPS = 4

interface Interest {
  id: string
  name: string
  slug: string
  emoji: string
}

type CardCategory = 'selected' | 'suggested' | 'other'

// ---------------------------------------------------------------------------
// InterestCard (reused from before)
// ---------------------------------------------------------------------------
function InterestCard({
  interest,
  category,
  onToggle,
  isMaxed,
  forYouLabel,
}: {
  interest: Interest
  category: CardCategory
  onToggle: (id: string) => void
  isMaxed: boolean
  forYouLabel: string
}) {
  const isSelected = category === 'selected'
  const isSuggested = category === 'suggested'
  const isDisabled = !isSelected && isMaxed

  const borderClass = isSelected
    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
    : isSuggested
      ? 'border-amber-300/70 bg-amber-50/50 hover:border-amber-400 hover:bg-amber-50 dark:bg-amber-950/20 dark:hover:bg-amber-950/40'
      : 'border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/40'

  return (
    <motion.button
      layout
      layoutId={`card-${interest.id}`}
      onClick={() => onToggle(interest.id)}
      disabled={isDisabled}
      className={[
        'relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center',
        'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        borderClass,
        isDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: isDisabled ? 0.35 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      whileHover={!isDisabled ? { scale: 1.05, y: -2 } : undefined}
      whileTap={!isDisabled ? { scale: 0.95 } : undefined}
    >
      <AnimatePresence>
        {isSelected && (
          <motion.span
            key="check"
            className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 600, damping: 30 }}
          >
            <Check className="h-3 w-3" strokeWidth={3} />
          </motion.span>
        )}
        {isSuggested && (
          <motion.span
            key="badge"
            className="absolute right-1.5 top-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.2 }}
          >
            {forYouLabel}
          </motion.span>
        )}
      </AnimatePresence>

      <span className="text-[2rem] leading-none">{interest.emoji}</span>
      <span className="text-[11px] font-semibold leading-tight text-foreground/80">
        {interest.name}
      </span>
    </motion.button>
  )
}

// ---------------------------------------------------------------------------
// SectionHeading
// ---------------------------------------------------------------------------
function SectionHeading({
  label,
  icon,
  className = '',
}: {
  label: string
  icon?: ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={`mb-3 flex items-center gap-1.5 ${className}`}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.2 }}
    >
      {icon}
      <span className="text-[11px] font-bold uppercase tracking-widest text-current">
        {label}
      </span>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// OptionCard — generic selectable card for steps 1-3
// ---------------------------------------------------------------------------
function OptionCard({
  selected,
  onClick,
  icon,
  label,
  hint,
  badge,
}: {
  selected: boolean
  onClick: () => void
  icon: ReactNode
  label: string
  hint?: string
  badge?: string
}) {
  return (
    <motion.button
      onClick={onClick}
      className={[
        'relative flex w-full items-center gap-4 rounded-2xl border-2 p-5 text-left transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        selected
          ? 'border-primary bg-primary/5 dark:bg-primary/10'
          : 'border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/40',
      ].join(' ')}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* Check indicator */}
      <div
        className={[
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
          selected
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground',
        ].join(' ')}
      >
        {selected ? <Check className="h-4 w-4" strokeWidth={3} /> : icon}
      </div>

      <div className="flex-1">
        <span className="text-sm font-semibold">{label}</span>
        {hint && (
          <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        )}
      </div>

      {badge && (
        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
          {badge}
        </span>
      )}
    </motion.button>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function OnboardingPage() {
  const router = useRouter()
  const t = useTranslations('onboarding')
  const tc = useTranslations('common')

  // Step state (0-indexed)
  const [step, setStep] = useState(0)

  // Auto-detect user's timezone (silent, no UI step)
  const [detectedTimezone] = useState(() =>
    Intl.DateTimeFormat().resolvedOptions().timeZone
  )

  // Step 1: Language
  const [language, setLanguage] = useState('es')

  // Step 2: Word count
  const [wordCount, setWordCount] = useState(10)

  // Step 3: Level
  const [level, setLevel] = useState('intermediate')

  // Step 4: Interests
  const [interests, setInterests] = useState<Interest[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Fetch interests on mount
  useEffect(() => {
    fetch('/api/interests')
      .then((r) => r.json())
      .then((data) => {
        setInterests(data.all || [])
        if (data.selected?.length) {
          setSelected(new Set(data.selected))
        }
      })
      .finally(() => setIsLoading(false))
  }, [])

  // Interest helpers
  const toggleInterest = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < MAX_INTERESTS) {
        next.add(id)
      }
      return next
    })
  }

  const { selectedList, suggestedList, otherList } = useMemo(() => {
    const selIds = new Set(selected)
    const selSlugs = interests
      .filter((i) => selIds.has(i.id))
      .map((i) => i.slug)
    const sugSlugSet = new Set(selSlugs.flatMap((s) => RELATED_INTERESTS[s] ?? []))

    return {
      selectedList: interests.filter((i) => selIds.has(i.id)),
      suggestedList: interests.filter(
        (i) => !selIds.has(i.id) && sugSlugSet.has(i.slug),
      ),
      otherList: interests.filter(
        (i) => !selIds.has(i.id) && !sugSlugSet.has(i.slug),
      ),
    }
  }, [interests, selected])

  const isMaxed = selected.size >= MAX_INTERESTS
  const canContinueInterests = selected.size >= MIN_INTERESTS

  // Can always continue from steps 1-3 (all have defaults)
  const canContinue = step < 3 ? true : canContinueInterests

  // Interests hint text
  const remaining = Math.max(0, MIN_INTERESTS - selected.size)
  const interestsHint =
    remaining > 0
      ? t('selectMoreTopics', { remaining })
      : isMaxed
        ? t('maxReached')
        : t('canAddMore', { remaining: MAX_INTERESTS - selected.size })

  // Handle language change — apply immediately so UI switches
  const handleLanguageChange = async (locale: string) => {
    setLanguage(locale)
    await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale }),
    })
    router.refresh()
  }

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const handleFinish = async () => {
    if (selected.size < MIN_INTERESTS) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/interests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interest_ids: Array.from(selected),
          complete_onboarding: true,
          daily_word_count: wordCount,
          preferred_difficulty: level,
          timezone: detectedTimezone,
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      router.push('/')
      router.refresh()
    } catch {
      toast.error(t('saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  // Step titles and descriptions for the header
  const stepConfig = [
    { title: t('languageTitle'), description: t('languageDescription') },
    { title: t('wordCountTitle'), description: t('wordCountDescription') },
    { title: t('levelTitle'), description: t('levelDescription') },
    { title: t('whatInterests'), description: interestsHint },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Sticky header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Wordlary · {t('initialSetup')}
                </p>
                <button
                  onClick={handleLogout}
                  className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
                >
                  <LogOut className="h-3 w-3" />
                  {tc('signOut')}
                </button>
              </div>
              <AnimatePresence mode="wait">
                <motion.h1
                  key={`title-${step}`}
                  className="mt-0.5 text-xl font-bold tracking-tight"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {stepConfig[step].title}
                </motion.h1>
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.p
                  key={`desc-${step}-${step === 3 ? interestsHint : ''}`}
                  className="mt-0.5 text-xs text-muted-foreground"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                >
                  {stepConfig[step].description}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Logout (desktop) + Step indicator */}
            <div className="flex shrink-0 flex-col items-end gap-1 pt-1">
              <button
                onClick={handleLogout}
                className="hidden items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:flex"
              >
                <LogOut className="h-3 w-3" />
                {tc('signOut')}
              </button>
              {/* Step dots */}
              <div className="flex gap-1.5">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="h-2 rounded-full"
                    animate={{
                      width: i === step ? 20 : 8,
                      backgroundColor:
                        i < step
                          ? '#10b981'
                          : i === step
                            ? 'hsl(var(--primary))'
                            : 'hsl(var(--border))',
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                ))}
              </div>
              <span className="mt-1 text-[10px] text-muted-foreground">
                {t('stepOf', { current: step + 1, total: TOTAL_STEPS })}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Scrollable content ─────────────────────────────────────────── */}
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-6 pb-36">
          <AnimatePresence mode="wait">
            {/* ── Step 1: Language ──────────────────────────────────────── */}
            {step === 0 && (
              <motion.div
                key="step-language"
                className="space-y-3"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.25 }}
              >
                <OptionCard
                  selected={language === 'es'}
                  onClick={() => handleLanguageChange('es')}
                  icon={<span className="text-sm">🇪🇸</span>}
                  label="Español"
                  hint="Interfaz en español"
                />
                <OptionCard
                  selected={language === 'en'}
                  onClick={() => handleLanguageChange('en')}
                  icon={<span className="text-sm">🇺🇸</span>}
                  label="English"
                  hint="Interface in English"
                />
              </motion.div>
            )}

            {/* ── Step 2: Word count ───────────────────────────────────── */}
            {step === 1 && (
              <motion.div
                key="step-wordcount"
                className="space-y-3"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.25 }}
              >
                {[5, 10, 15].map((count) => (
                  <OptionCard
                    key={count}
                    selected={wordCount === count}
                    onClick={() => setWordCount(count)}
                    icon={<BookOpen className="h-4 w-4" />}
                    label={t('wordCountWords', { count })}
                    badge={count === 10 ? t('wordCountRecommended') : undefined}
                  />
                ))}
              </motion.div>
            )}

            {/* ── Step 3: Level ────────────────────────────────────────── */}
            {step === 2 && (
              <motion.div
                key="step-level"
                className="space-y-3"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.25 }}
              >
                <OptionCard
                  selected={level === 'beginner'}
                  onClick={() => setLevel('beginner')}
                  icon={<GraduationCap className="h-4 w-4" />}
                  label={t('levelBeginner')}
                  hint={t('levelBeginnerHint')}
                />
                <OptionCard
                  selected={level === 'intermediate'}
                  onClick={() => setLevel('intermediate')}
                  icon={<GraduationCap className="h-4 w-4" />}
                  label={t('levelIntermediate')}
                  hint={t('levelIntermediateHint')}
                />
                <OptionCard
                  selected={level === 'advanced'}
                  onClick={() => setLevel('advanced')}
                  icon={<GraduationCap className="h-4 w-4" />}
                  label={t('levelAdvanced')}
                  hint={t('levelAdvancedHint')}
                />
              </motion.div>
            )}

            {/* ── Step 4: Interests ────────────────────────────────────── */}
            {step === 3 && (
              <motion.div
                key="step-interests"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.25 }}
              >
                {isLoading ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <LayoutGroup id="interests-grid">
                    <motion.div layout className="space-y-8">
                      {/* Selected section */}
                      <AnimatePresence>
                        {selectedList.length > 0 && (
                          <motion.div
                            key="selected-section"
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                          >
                            <AnimatePresence>
                              <SectionHeading
                                key="selected-heading"
                                label={t('yourTopics')}
                                icon={<Check className="h-3 w-3" strokeWidth={3} />}
                                className="text-emerald-600 dark:text-emerald-400"
                              />
                            </AnimatePresence>
                            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                              <AnimatePresence mode="popLayout">
                                {selectedList.map((interest) => (
                                  <InterestCard
                                    key={interest.id}
                                    interest={interest}
                                    category="selected"
                                    onToggle={toggleInterest}
                                    isMaxed={isMaxed}
                                    forYouLabel={t('forYou')}
                                  />
                                ))}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Suggested section */}
                      <AnimatePresence>
                        {suggestedList.length > 0 && (
                          <motion.div
                            key="suggested-section"
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25, delay: 0.06 }}
                          >
                            <AnimatePresence>
                              <SectionHeading
                                key="suggested-heading"
                                label={t('alsoLike')}
                                icon={<Sparkles className="h-3 w-3" />}
                                className="text-amber-600 dark:text-amber-400"
                              />
                            </AnimatePresence>
                            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                              <AnimatePresence mode="popLayout">
                                {suggestedList.map((interest) => (
                                  <InterestCard
                                    key={interest.id}
                                    interest={interest}
                                    category="suggested"
                                    onToggle={toggleInterest}
                                    isMaxed={isMaxed}
                                    forYouLabel={t('forYou')}
                                  />
                                ))}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Other interests */}
                      {otherList.length > 0 && (
                        <motion.div layout>
                          {selectedList.length > 0 ? (
                            <AnimatePresence>
                              <SectionHeading
                                key="more-heading"
                                label={t('moreTopics')}
                                className="text-muted-foreground"
                              />
                            </AnimatePresence>
                          ) : (
                            <p className="mb-4 text-sm text-muted-foreground">
                              {t('chooseTopics', {
                                min: MIN_INTERESTS,
                                max: MAX_INTERESTS,
                              })}
                            </p>
                          )}
                          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                            <AnimatePresence mode="popLayout">
                              {otherList.map((interest) => (
                                <InterestCard
                                  key={interest.id}
                                  interest={interest}
                                  category="other"
                                  onToggle={toggleInterest}
                                  isMaxed={isMaxed}
                                  forYouLabel={t('forYou')}
                                />
                              ))}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  </LayoutGroup>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ── Fixed bottom bar ───────────────────────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/40 bg-background/90 backdrop-blur-lg">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center gap-3">
            {/* Back button */}
            {step > 0 && (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={handleBack}
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('back')}
              </motion.button>
            )}

            {/* Progress bar */}
            <div className="flex-1">
              <div className="h-1 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  animate={{
                    width: step === 3
                      ? `${Math.min((selected.size / MIN_INTERESTS) * 100, 100)}%`
                      : `${((step + 1) / TOTAL_STEPS) * 100}%`,
                  }}
                  transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                />
              </div>
            </div>

            {/* CTA button */}
            <motion.button
              layout
              onClick={step === TOTAL_STEPS - 1 ? handleFinish : handleNext}
              disabled={!canContinue || isSaving}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:pointer-events-none disabled:opacity-40"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {isSaving
                ? t('saving')
                : step === TOTAL_STEPS - 1
                  ? t('finish')
                  : t('continue')}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}
