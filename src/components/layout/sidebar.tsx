'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, RotateCcw, BookA, BarChart3, Settings, BookOpen, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('nav')
  const tc = useTranslations('common')

  const navItems = [
    { href: '/', label: t('home'), icon: Home },
    { href: '/review', label: t('review'), icon: RotateCcw },
    { href: '/words', label: t('words'), icon: BookA },
    { href: '/progress', label: t('progress'), icon: BarChart3 },
    { href: '/settings', label: t('settings'), icon: Settings },
  ]

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-muted/30">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <BookOpen className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">VocabFlow</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          {tc('signOut')}
        </button>
      </div>
    </aside>
  )
}
