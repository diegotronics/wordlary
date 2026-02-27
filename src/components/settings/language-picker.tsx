'use client'

interface LanguagePickerProps {
  value: string
  onChange: (locale: string) => void
}

const languages = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
]

export function LanguagePicker({ value, onChange }: LanguagePickerProps) {
  return (
    <div className="flex gap-2">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => onChange(lang.code)}
          className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            value === lang.code
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border hover:bg-muted'
          }`}
        >
          <span>{lang.flag}</span>
          {lang.label}
        </button>
      ))}
    </div>
  )
}
