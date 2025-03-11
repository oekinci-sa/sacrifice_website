import { AlertCircle } from "lucide-react";

interface NotFoundProps {
  message?: string;
}

export function NotFound({ message = "Kayıt bulunamadı" }: NotFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-40">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  );
} 