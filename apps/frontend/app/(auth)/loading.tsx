import { Skeleton } from '@/components/Skeleton';

export default function AuthLoading() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-lg border border-border bg-card p-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-4 w-2/3 mx-auto" />
      </div>
    </div>
  );
}
