import { DashboardSkeleton, PageHeaderSkeleton } from '@/components/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <DashboardSkeleton />
    </div>
  );
}
