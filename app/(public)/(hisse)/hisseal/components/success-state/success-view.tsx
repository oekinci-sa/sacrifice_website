import { Button } from "@/components/ui/button";
import { TripleInfo } from "@/app/(public)/components/triple-info";
import { useRouter } from "next/navigation";

interface SuccessViewProps {
  onPdfDownload: () => void;
}

export const SuccessView = ({ onPdfDownload }: SuccessViewProps) => {
  const router = useRouter();
  
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-16">
      <div className="flex flex-col items-center justify-center space-y-6">
        {/* Icon */}
        <div className="rounded-full flex items-center justify-center">
          <i className="bi bi-patch-check-fill text-8xl text-sac-primary"></i>
        </div>
        {/* Teşekkürler mesajı */}
        <div>
          <h1 className="text-2xl sm:text-4xl text-center font-bold mb-2 sm:mb-4">Teşekkürler...</h1>
          <p className="text-muted-foreground text-center text-base sm:text-lg">
            Hisse kaydınız başarıyla oluşturulmuştur.
          </p>
          {/* Buttons */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-4 sm:mt-8">
            <Button
              className="flex items-center justify-center gap-1 sm:gap-2 bg-black hover:bg-black/90 text-white px-2 sm:px-4 py-2 sm:py-3 h-auto text-sm sm:text-lg"
              onClick={() => router.push('/hissesorgula')}
            >
              <i className="bi bi-search text-base sm:text-xl"></i>
              Hisse Sorgula
            </Button>
            <Button
              className="flex items-center justify-center gap-1 sm:gap-2 bg-sac-primary hover:bg-sac-primary/90 text-white px-2 sm:px-4 py-2 sm:py-3 h-auto text-sm sm:text-lg"
              onClick={onPdfDownload}
            >
              <i className="bi bi-cloud-download text-base sm:text-xl"></i>
              PDF İndir
            </Button>
          </div>
        </div>
      </div>

      <TripleInfo />
    </div>
  );
}; 