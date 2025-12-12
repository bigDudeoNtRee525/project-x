import { PageHeaderSkeleton, CardGridSkeleton } from '@/components/Skeleton';

export default function ContactsLoading() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          <div className="h-4 w-56 bg-muted rounded animate-pulse mt-2" />
        </div>
        <div className="p-6">
          <CardGridSkeleton count={6} />
        </div>
      </div>
    </div>
  );
}
