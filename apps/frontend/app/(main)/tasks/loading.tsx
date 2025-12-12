import { PageHeaderSkeleton, TableSkeleton } from '@/components/Skeleton';

export default function TasksLoading() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="h-6 w-24 bg-muted rounded animate-pulse" />
          <div className="h-4 w-48 bg-muted rounded animate-pulse mt-2" />
        </div>
        <TableSkeleton rows={8} columns={7} />
      </div>
    </div>
  );
}
