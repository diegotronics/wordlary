'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, RotateCcw, BarChart3, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

export function MobileNav() {
  const pathname = usePathname()
  const t = useTranslations('nav')

  const navItems = [
    { href: '/', label: t('home'), icon: Home },
    { href: '/review', label: t('review'), icon: RotateCcw },
    { href: '/progress', label: t('progress'), icon: BarChart3 },
    { href: '/settings', label: t('settings'), icon: Settings },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
