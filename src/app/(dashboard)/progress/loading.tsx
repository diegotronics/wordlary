import { Skeleton } from '@/components/ui/skeleton'

export default function ProgressLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
