'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

interface Interest {
  id: string
  name: string
  slug: string
  emoji: string
}

const MIN_INTERESTS = 3
const MAX_INTERESTS = 6

export default function OnboardingPage() {
  const router = useRouter()
  const [interests, setInterests] = useState<Interest[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

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

  const handleContinue = async () => {
    if (selected.size < MIN_INTERESTS) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/interests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interest_ids: Array.from(selected),
          complete_onboarding: true,
        }),
      })
      if (!res.ok) throw new Error('Failed to save interests')
      router.push('/')
      router.refresh()
    } catch {
      toast.error('Failed to save your interests. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">What are you interested in?</CardTitle>
          <CardDescription>
            Choose {MIN_INTERESTS}-{MAX_INTERESTS} topics to personalize your vocabulary.
            We&apos;ll generate words related to your interests.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {interests.map((interest) => {
                  const isSelected = selected.has(interest.id)
                  return (
                    <button
                      key={interest.id}
                      onClick={() => toggleInterest(interest.id)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:border-primary/40 hover:bg-muted/50'
                      }`}
                    >
                      <span className="text-2xl">{interest.emoji}</span>
                      <span className="text-sm font-medium">{interest.name}</span>
                    </button>
                  )
                })}
              </div>

              <div className="space-y-3">
                <p className="text-center text-sm text-muted-foreground">
                  {selected.size} of {MIN_INTERESTS} minimum selected
                </p>
                <Button
                  onClick={handleContinue}
                  disabled={selected.size < MIN_INTERESTS || isSaving}
                  className="w-full"
                  size="lg"
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Continue to VocabFlow
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
