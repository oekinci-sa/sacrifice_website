import { Loader2 } from "lucide-react";

interface LoadingProps {
  text?: string;
}

export function Loading({ text = "Yükleniyor..." }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-40">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  );
} 