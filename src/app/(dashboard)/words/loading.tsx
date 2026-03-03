import { Skeleton } from '@/components/ui/skeleton'

export default function WordsLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
