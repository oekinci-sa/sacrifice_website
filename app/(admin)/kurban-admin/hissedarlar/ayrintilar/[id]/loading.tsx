export default function Loading() {
  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Hissedar Detayları</h2>
        <p className="text-muted-foreground">
          Yükleniyor...
        </p>
      </div>
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  );
} 