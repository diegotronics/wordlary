import { Skeleton } from '@/components/ui/skeleton'

export default function ReviewLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-2 w-full" />
      <Skeleton className="mx-auto h-[320px] w-full max-w-sm rounded-2xl" />
    </div>
  )
}
