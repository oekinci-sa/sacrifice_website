import { sacrificeSchema } from "@/types";
import { useEffect, useRef } from "react";

// Handle interaction timeout
export const useHandleInteractionTimeout = (
  isSuccess: boolean,
  currentStep: string,
  selectedSacrifice: sacrificeSchema | null,
  formData: unknown[],
  lastInteractionTime: number,
  showWarning: boolean,
  setShowWarning: (show: boolean) => void,
  setInactivitySecondsLeft: (seconds: number) => void,
  TIMEOUT_DURATION: number,
  WARNING_THRESHOLD: number,
  openDialogs?: {
    isDialogOpen?: boolean;
    setIsDialogOpen?: (open: boolean) => void;
    showReservationInfo?: boolean;
    setShowReservationInfo?: (show: boolean) => void;
    showThreeMinuteWarning?: boolean;
    setShowThreeMinuteWarning?: (show: boolean) => void;
    showOneMinuteWarning?: boolean;
    setShowOneMinuteWarning?: (show: boolean) => void;
  },
  customTimeoutHandler?: () => Promise<void>
) => {
  const firedRef = useRef(false);
  const lastInteractionRef = useRef(lastInteractionTime);
  const handlerRef = useRef(customTimeoutHandler);
  handlerRef.current = customTimeoutHandler;

  useEffect(() => {
    if (isSuccess) return;
    if (currentStep !== "details" && currentStep !== "confirmation") return;
    if (!selectedSacrifice || !formData.length) return;

    if (lastInteractionRef.current !== lastInteractionTime) {
      lastInteractionRef.current = lastInteractionTime;
      firedRef.current = false;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastInteractionTime) / 1000;
      const timeLeft = Math.max(0, TIMEOUT_DURATION - elapsed);

      setInactivitySecondsLeft(Math.floor(timeLeft));

      if (timeLeft <= WARNING_THRESHOLD && !showWarning) {
        setShowWarning(true);
      }

      if (timeLeft <= 0 && !firedRef.current) {
        firedRef.current = true;
        clearInterval(interval);

        setShowWarning(false);

        if (openDialogs) {
          openDialogs.setIsDialogOpen?.(false);
          openDialogs.setShowReservationInfo?.(false);
          openDialogs.setShowThreeMinuteWarning?.(false);
          openDialogs.setShowOneMinuteWarning?.(false);
        }

        const handler = handlerRef.current;
        if (handler) {
          // setTimeout(0): setInterval timer fazından çık, sonraki macrotask'ta çalıştır;
          // React commit + paint tamamlansın — inactivity sonrası Hisse Al butonu tıklanamama
          setTimeout(() => void handler(), 0);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    isSuccess,
    currentStep,
    lastInteractionTime,
    TIMEOUT_DURATION,
    WARNING_THRESHOLD,
    showWarning,
    selectedSacrifice,
    formData,
    setShowWarning,
    setInactivitySecondsLeft,
    openDialogs,
  ]);
};

// Sayfa seviyesinde etkileşimleri takip et (inactivity timeout için lastInteractionTime sıfırlanır)
// NOT: setTimeLeft burada ÇAĞRILMAMALI — display session timer'dan gelir. Burada setTimeLeft
// çağrılırsa her tıklama/klavye ile timer 3 dk'ya sıçrar ve titreşim olur.
export const useTrackInteractions = (
  currentStep: string,
  setLastInteractionTime: (time: number) => void,
  setShowWarning: (show: boolean) => void
) => {
  useEffect(() => {
    const handleInteraction = () => {
      if (currentStep === "details" || currentStep === "confirmation") {
        setLastInteractionTime(Date.now());
        setShowWarning(false);
      }
    };

    const handleMouseInteraction = () => handleInteraction();
    const handleKeyInteraction = () => handleInteraction();
    const handleScrollInteraction = () => handleInteraction();
    const handleFocusInteraction = () => handleInteraction();

    if (currentStep === "details" || currentStep === "confirmation") {
      window.addEventListener("mousedown", handleMouseInteraction);
      window.addEventListener("keydown", handleKeyInteraction);
      window.addEventListener("scroll", handleScrollInteraction);
      window.addEventListener("focus", handleFocusInteraction);
    }

    return () => {
      window.removeEventListener("mousedown", handleMouseInteraction);
      window.removeEventListener("keydown", handleKeyInteraction);
      window.removeEventListener("scroll", handleScrollInteraction);
      window.removeEventListener("focus", handleFocusInteraction);
    };
  }, [currentStep, setLastInteractionTime, setShowWarning]);
};
