'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface LanguagePickerProps {
  currentLocale: string
}

const languages = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
]

export function LanguagePicker({ currentLocale }: LanguagePickerProps) {
  const router = useRouter()
  const [isChanging, setIsChanging] = useState(false)

  const handleChange = async (locale: string) => {
    if (locale === currentLocale) return
    setIsChanging(true)

    await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale }),
    })

    router.refresh()
  }

  return (
    <div className="flex gap-2">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleChange(lang.code)}
          disabled={isChanging}
          className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            currentLocale === lang.code
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border hover:bg-muted'
          }`}
        >
          {isChanging && currentLocale !== lang.code ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <span>{lang.flag}</span>
          )}
          {lang.label}
        </button>
      ))}
    </div>
  )
}
