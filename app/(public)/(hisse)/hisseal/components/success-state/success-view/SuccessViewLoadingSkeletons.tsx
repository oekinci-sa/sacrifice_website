import { Skeleton } from "@/components/ui/skeleton";

export function SuccessViewLoadingSkeletons() {
  return (
    <div className="mt-8 w-full max-w-xl mx-auto">
      <div className="flex justify-between mb-4">
        <Skeleton className="h-7 w-64" />
      </div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="border rounded-lg p-3 flex justify-between items-center bg-gray-50 mb-3"
        >
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      ))}
    </div>
  );
}
