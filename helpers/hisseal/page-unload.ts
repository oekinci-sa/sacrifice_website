import { shouldRedirectReservationToSelection } from "@/lib/reservation-terminal-status";
import { useReservationIDStore } from "@/stores/only-public-pages/useReservationIDStore";
import { sacrificeSchema } from "@/types";
import { useEffect } from "react";
import { CANCEL_RESERVATION_API } from "./types";

const CHECK_RESERVATION_STATUS_API = "/api/check-reservation-status";

function shouldCancelOnExit(
  currentStep: string,
  selectedSacrifice: sacrificeSchema | null,
  formData: unknown[],
  transaction_id: string
): boolean {
  if (currentStep !== "details" && currentStep !== "confirmation") return false;
  if (!selectedSacrifice || !formData.length) return false;
  if (!transaction_id) return false;
  return true;
}

function sendCancelBeacon(transaction_id: string) {
  const blob = new Blob([JSON.stringify({ transaction_id })], {
    type: "application/json",
  });
  navigator.sendBeacon(CANCEL_RESERVATION_API, blob);
}

/**
 * Sayfa kapatma/yenileme durumunda rezervasyonu iptal eder.
 * beforeunload: kullanıcıya "sayfadan çıkıyor musun?" uyarısı gösterir.
 * pagehide:     gerçek kapanmada (persisted === false) sendBeacon ile cancel atar.
 *               persisted === true (bfCache) ise beacon atılmaz; kullanıcı geri dönebilir.
 * unload kaldırıldı: mobilde güvenilmez, bfCache ile uyumsuz.
 */
export const setupPageUnloadHandlers = ({
  currentStep,
  selectedSacrifice,
  formData,
  transaction_id,
}: {
  currentStep: string;
  selectedSacrifice: sacrificeSchema | null;
  formData: unknown[];
  transaction_id: string;
}) => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (!shouldCancelOnExit(currentStep, selectedSacrifice, formData, transaction_id)) return;
    e.preventDefault();
    e.returnValue = "";
  };

  const handlePageHide = (e: PageTransitionEvent) => {
    if (!shouldCancelOnExit(currentStep, selectedSacrifice, formData, transaction_id)) return;
    // persisted === true → bfCache'e alındı; kullanıcı geri dönebilir, iptal etme
    if (e.persisted) return;
    sendCancelBeacon(transaction_id);
  };

  return { handleBeforeUnload, handlePageHide };
};

/**
 * Sayfa yenilenirken veya kapatılırken gerekli temizleme işlemlerini yapar.
 * unload yerine pagehide kullanılır (mobil + bfCache uyumlu).
 */
export const useHandlePageUnload = ({
  currentStep,
  selectedSacrifice,
  formData,
  isSuccess,
}: {
  currentStep: string;
  selectedSacrifice: sacrificeSchema | null;
  formData: unknown[];
  isSuccess: boolean;
}) => {
  const { transaction_id } = useReservationIDStore();

  useEffect(() => {
    if (isSuccess) return;

    const { handleBeforeUnload, handlePageHide } = setupPageUnloadHandlers({
      currentStep,
      selectedSacrifice,
      formData,
      transaction_id,
    });

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [currentStep, selectedSacrifice, formData, transaction_id, isSuccess]);
};

/**
 * bfCache'ten sayfa geri yüklendiğinde (pageshow + persisted === true)
 * rezervasyon durumunu kontrol eder.
 * Durum expired / canceled ise onExpired callback'i setTimeout(0) ile defer edilir
 * (reservation-timer-invariants.mdc §5.2 uyarınca Hisse Al butonu tıklanabilir kalır).
 */
export const useHandlePageShow = ({
  currentStep,
  transaction_id,
  isSuccess,
  onExpired,
}: {
  currentStep: string;
  transaction_id: string;
  isSuccess: boolean;
  onExpired: () => void;
}) => {
  useEffect(() => {
    if (isSuccess) return;
    if (currentStep !== "details" && currentStep !== "confirmation") return;
    if (!transaction_id) return;

    const handlePageShow = async (e: PageTransitionEvent) => {
      if (!e.persisted) return;

      try {
        const res = await fetch(
          `${CHECK_RESERVATION_STATUS_API}?transaction_id=${encodeURIComponent(transaction_id)}`
        );
        if (!res.ok) return;
        const data = await res.json();
        const status: string = data?.status ?? "";

        if (shouldRedirectReservationToSelection(status)) {
          setTimeout(() => onExpired(), 0);
        }
      } catch {
        // Sessiz başarısızlık; mevcut akış devam eder
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [currentStep, transaction_id, isSuccess, onExpired]);
};
