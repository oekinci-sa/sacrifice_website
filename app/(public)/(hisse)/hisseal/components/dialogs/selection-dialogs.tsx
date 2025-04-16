import { sacrificeSchema } from "@/types";
import { ReservationInfoDialog } from "../reservation-info-dialog";
import { ShareSelectDialog } from "../table-step/share-select-dialog";

interface SelectionDialogsProps {
    tempSelectedSacrifice: sacrificeSchema | null;
    isDialogOpen: boolean;
    setIsDialogOpen: (open: boolean) => void;
    showReservationInfo: boolean;
    setShowReservationInfo: (show: boolean) => void;
    handleShareCountSelect: (count: number) => Promise<void>;
    handleReservationInfoClose: () => void;
    isReservationLoading: boolean;
}

export const SelectionDialogs = ({
    tempSelectedSacrifice,
    isDialogOpen,
    setIsDialogOpen,
    showReservationInfo,
    setShowReservationInfo,
    handleShareCountSelect,
    handleReservationInfoClose,
    isReservationLoading,
}: SelectionDialogsProps) => {
    return (
        <>
            {/* Dialog for selecting share count */}
            {tempSelectedSacrifice && (
                <ShareSelectDialog
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    sacrifice={tempSelectedSacrifice}
                    onSelect={handleShareCountSelect}
                    isLoading={isReservationLoading}
                />
            )}

            {/* Reservation Info Dialog - shown after share selection */}
            <ReservationInfoDialog
                isOpen={showReservationInfo}
                onClose={handleReservationInfoClose}
            />
        </>
    );
}; 