'use client'

import { BookOpen } from 'lucide-react'

export function Header() {
  return (
    <header className="flex h-14 items-center border-b px-4 md:hidden">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <span className="font-bold">VocabFlow</span>
      </div>
    </header>
  )
}
