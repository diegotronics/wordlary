import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  )
}
