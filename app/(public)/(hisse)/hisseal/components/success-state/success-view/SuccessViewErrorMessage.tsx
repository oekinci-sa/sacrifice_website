import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface SuccessViewErrorMessageProps {
  dbError: Error | null;
  debugInfo: string | null;
}

export function SuccessViewErrorMessage({
  dbError,
  debugInfo,
}: SuccessViewErrorMessageProps) {
  return (
    <Alert variant="destructive" className="mt-8 max-w-xl mx-auto">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Veri Alınamadı</AlertTitle>
      <AlertDescription>
        Hissedar bilgileri alınırken bir hata oluştu. Lütfen sayfayı yenileyiniz.
        {dbError && (
          <p className="mt-2 text-xs">{(dbError as Error).message}</p>
        )}
        {debugInfo && <p className="mt-2 text-xs">Debug: {debugInfo}</p>}
      </AlertDescription>
    </Alert>
  );
}
