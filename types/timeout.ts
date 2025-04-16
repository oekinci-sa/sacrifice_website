import { MutableRefObject } from "react";

export interface CustomTimeoutHandlerProps {
    resetStore: () => void;
    goToStep: (step: any) => void;
    toast: any;
    refetchSacrifices: () => void;
    transaction_id: string;
    setShowWarning: (show: boolean) => void;
    setIsDialogOpen: (open: boolean) => void;
    setShowReservationInfo: (show: boolean) => void;
    setShowThreeMinuteWarning: (show: boolean) => void;
    setShowOneMinuteWarning: (show: boolean) => void;
    setCameFromTimeout: (timeout: boolean) => void;
    needsRerender: MutableRefObject<boolean>;
} 