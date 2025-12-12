import { PageHeaderSkeleton, Skeleton } from '@/components/Skeleton';

export default function MeetingsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="grid grid-cols-7 gap-2">
          {/* Calendar header */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center py-2">
              <Skeleton className="h-4 w-8 mx-auto" />
            </div>
          ))}
          {/* Calendar days */}
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square p-2">
              <Skeleton className="h-6 w-6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
