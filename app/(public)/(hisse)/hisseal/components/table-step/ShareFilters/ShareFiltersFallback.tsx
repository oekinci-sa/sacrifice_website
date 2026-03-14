export function ShareFiltersFallback() {
  return (
    <div className="flex flex-col justify-center gap-2 md:gap-4">
      <div className="flex flex-row items-center justify-center gap-2 md:my-4 md:gap-4">
        <div className="w-[150px] h-8 md:h-10 bg-gray-200 animate-pulse rounded-md"></div>
        <div className="w-[150px] h-8 md:h-10 bg-gray-200 animate-pulse rounded-md"></div>
      </div>
      <div className="bg-blue-50 border border-blue-200 text-sm text-center text-blue-800 rounded-md p-2 md:hidden mt-4">
        Tüm tabloyu görmek için sağa kaydırınız.
      </div>
    </div>
  );
}
