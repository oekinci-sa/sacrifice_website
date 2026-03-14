export function SuccessViewNoData() {
  return (
    <div className="mt-8 text-center">
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 max-w-md mx-auto">
        <h3 className="text-amber-800 font-medium mb-2">Veri Bulunamadı</h3>
        <p className="text-amber-700 text-sm">
          Hissedar bilgileri görüntülenemiyor. Lütfen Hisse Sorgula sayfasından
          işleminizi kontrol ediniz.
        </p>
      </div>
    </div>
  );
}
