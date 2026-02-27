'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, Save, LogOut } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { toast } from 'sonner'

interface Interest {
  id: string
  name: string
  slug: string
  emoji: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [displayName, setDisplayName] = useState('')
  const [dailyWordCount, setDailyWordCount] = useState(10)
  const [difficulty, setDifficulty] = useState('intermediate')
  const [allInterests, setAllInterests] = useState<Interest[]>([])
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, daily_word_count, preferred_difficulty')
        .eq('id', user.id)
        .single()

      if (profile) {
        setDisplayName(profile.display_name || '')
        setDailyWordCount(profile.daily_word_count || 10)
        setDifficulty(profile.preferred_difficulty || 'intermediate')
      }

      const res = await fetch('/api/interests')
      const data = await res.json()
      setAllInterests(data.all || [])
      setSelectedInterests(new Set(data.selected || []))

      setIsLoading(false)
    }
    load()
  }, [])

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        if (next.size <= 3) return prev
        next.delete(id)
      } else if (next.size < 6) {
        next.add(id)
      }
      return next
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          daily_word_count: dailyWordCount,
          preferred_difficulty: difficulty,
        })
        .eq('id', user.id)

      await fetch('/api/interests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interest_ids: Array.from(selectedInterests) }),
      })

      toast.success('Settings saved successfully')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dailyWords">Daily Word Count</Label>
            <Input
              id="dailyWords"
              type="number"
              min={5}
              max={20}
              value={dailyWordCount}
              onChange={(e) => setDailyWordCount(parseInt(e.target.value) || 10)}
            />
            <p className="text-xs text-muted-foreground">Between 5 and 20 words per day</p>
          </div>
          <div className="space-y-2">
            <Label>Difficulty Level</Label>
            <div className="flex gap-2">
              {['beginner', 'intermediate', 'advanced'].map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-colors ${
                    difficulty === d
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Interests</CardTitle>
          <CardDescription>Choose 3-6 topics for your vocabulary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {allInterests.map((interest) => {
              const isSelected = selectedInterests.has(interest.id)
              return (
                <button
                  key={interest.id}
                  onClick={() => toggleInterest(interest.id)}
                  className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <span>{interest.emoji}</span>
                  <span className="font-medium">{interest.name}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>

        <Separator />

        <Button variant="outline" onClick={handleLogout} className="text-destructive hover:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
