import { Button } from "@/components/ui/button";
import { BlobProvider } from "@react-pdf/renderer";
import ReceiptPDF from "../ReceiptPDF";

export interface ReceiptData {
  shareholder_name: string;
  phone_number: string;
  delivery_location: string;
  sacrifice_consent: boolean;
  vekalet_durumu: string;
  share_price: string;
  delivery_fee: string;
  total_amount: string;
  paid_amount: string;
  remaining_payment: string;
  purchase_time: string;
  sacrifice_no: string;
  sacrifice_time: string;
  share_weight: string;
  transaction_id: string;
  security_code: string;
}

interface SuccessViewPdfSectionProps {
  shareholders: unknown[];
  createReceiptData: (shareholder: unknown) => ReceiptData;
  getDisplayName: (shareholder: unknown) => string;
  getDisplayPhone: (shareholder: unknown) => string;
  onPdfDownload?: () => void;
}

function downloadPdf(
  blob: Blob,
  shareholderName: string | undefined,
  onPdfDownload?: () => void
) {
  const safeName = shareholderName
    ? shareholderName.replace(/\s+/g, "-")
    : "hissedar";

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `kurban-hisse-bilgilendirme-${safeName}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  if (onPdfDownload) {
    onPdfDownload();
  }
}

export function SuccessViewPdfSection({
  shareholders,
  createReceiptData,
  getDisplayName,
  getDisplayPhone,
  onPdfDownload,
}: SuccessViewPdfSectionProps) {
  return (
    <div className="mt-8">
      <h2 className="text-lg md:text-xl font-semibold text-center mb-4">
        Hissedar Bilgi Dökümanları
      </h2>
      <div className="flex flex-col md:flex-row gap-4 md:gap-8">
        {shareholders.map((shareholder, index) => {
          const receiptData = createReceiptData(shareholder);
          const displayName = getDisplayName(shareholder);
          const displayPhone = getDisplayPhone(shareholder);

          return (
            <div
              key={index}
              className="border p-3 flex justify-between gap-8 items-center bg-gray-50"
            >
              <div>
                <p className="font-medium">{displayName}</p>
                <p className="text-sm text-gray-500">{displayPhone}</p>
              </div>

              <BlobProvider document={<ReceiptPDF data={receiptData} />}>
                {({ blob, loading, error }) => (
                  <Button
                    className="flex items-center justify-center gap-1 md:gap-2 bg-primary hover:bg-primary/90 text-white px-2 md:px-4 py-2 md:py-3 h-auto text-xs md:text-sm"
                    onClick={() =>
                      blob && downloadPdf(blob, displayName, onPdfDownload)
                    }
                    disabled={loading || !!error}
                  >
                    {loading ? (
                      "Yükleniyor..."
                    ) : error ? (
                      "Hata!"
                    ) : (
                      <>
                        <i className="bi bi-cloud-download text-base md:text-xl"></i>
                        PDF İndir
                      </>
                    )}
                  </Button>
                )}
              </BlobProvider>
            </div>
          );
        })}
      </div>
    </div>
  );
}
