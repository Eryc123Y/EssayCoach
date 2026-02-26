/**
 * Loading skeleton for role-based dashboard
 * Shows a generic loading state while role is being determined
 */

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-4 w-64 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="space-y-4">
        <div className="h-7 w-32 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      </div>

      {/* Activity Feed Skeleton */}
      <div className="space-y-4">
        <div className="h-7 w-40 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
