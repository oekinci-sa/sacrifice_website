import { sacrificeSchema } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { SelectionDialogs } from "../dialogs/selection-dialogs";
import { WarningDialogs } from "../dialogs/warning-dialogs";
import { FormView, Step } from "../process-state/form-view";
import { SuccessView } from "../success-state/success-view";

// Define the form data type
export type FormDataType = {
    name: string;
    phone: string;
    delivery_location: string;
    is_purchaser?: boolean;
};

// Define a toast function type
export type ToastFunction = (props: Parameters<typeof import("@/components/ui/use-toast").toast>[0]) => void;

// Define the form step type if it doesn't exist in types
export type FormStep = Step;

export interface PageLayoutProps {
    // Success state
    isSuccess: boolean;
    onPdfDownload: () => void;

    // Form state
    currentStep?: FormStep;
    tabValue?: string;
    timeLeft?: number;
    showWarning?: boolean;
    columns?: ColumnDef<sacrificeSchema>[];
    data?: sacrificeSchema[];
    selectedSacrifice?: sacrificeSchema | null;
    formData?: FormDataType[];
    isLoading?: boolean;
    serverTimeRemaining?: number;

    // Form handlers
    onSacrificeSelect?: (sacrifice: sacrificeSchema) => void;
    updateShareCount?: (shareCount: number) => void;
    setFormData?: (data: FormDataType[]) => void;
    goToStep?: (step: Step) => void;
    resetStore?: () => void;
    setLastInteractionTime?: (time: number) => void;
    setTimeLeft?: (time: number) => void;
    handleApprove?: () => void;
    toast?: ToastFunction;

    // Dialog states
    tempSelectedSacrifice?: sacrificeSchema | null;
    isDialogOpen?: boolean;
    setIsDialogOpen?: (isOpen: boolean) => void;
    showReservationInfo?: boolean;
    setShowReservationInfo?: (show: boolean) => void;
    showThreeMinuteWarning?: boolean;
    setShowThreeMinuteWarning?: (show: boolean) => void;
    showOneMinuteWarning?: boolean;
    setShowOneMinuteWarning?: (show: boolean) => void;

    // Dialog handlers
    handleShareCountSelect?: (shareCount: number) => void;
    handleReservationInfoClose?: () => void;
    handleDismissWarning?: (warningType?: "three-minute" | "one-minute") => void;
    getRemainingMinutesText?: () => string;
    isReservationLoading?: boolean;
}

export const PageLayout = ({
    // Success state
    isSuccess,
    onPdfDownload,

    // Form state
    currentStep,
    tabValue,
    timeLeft,
    showWarning,
    columns,
    data,
    selectedSacrifice,
    formData,
    isLoading,
    serverTimeRemaining,

    // Form handlers
    onSacrificeSelect,
    updateShareCount,
    setFormData,
    goToStep,
    resetStore,
    setLastInteractionTime,
    setTimeLeft,
    handleApprove,
    toast,

    // Dialog states
    tempSelectedSacrifice,
    isDialogOpen,
    setIsDialogOpen,
    showReservationInfo,
    setShowReservationInfo,
    showThreeMinuteWarning,
    setShowThreeMinuteWarning,
    showOneMinuteWarning,
    setShowOneMinuteWarning,

    // Dialog handlers
    handleShareCountSelect,
    handleReservationInfoClose,
    handleDismissWarning,
    getRemainingMinutesText,
    isReservationLoading,
}: PageLayoutProps) => {
    return (
        <div className="container flex flex-col space-y-8">
            {isSuccess ? (
                <SuccessView onPdfDownload={onPdfDownload} />
            ) : (
                <FormView
                    currentStep={currentStep as Step || "selection"}
                    tabValue={tabValue || "tab-1"}
                    timeLeft={timeLeft || 0}
                    showWarning={showWarning || false}
                    columns={columns || []}
                    data={data || []}
                    selectedSacrifice={selectedSacrifice || null}
                    formData={(formData || []).map(item => ({
                        ...item,
                        delivery_fee: 0,
                        sacrifice_consent: false
                    }))}
                    onSacrificeSelect={(sacrifice) => onSacrificeSelect?.(sacrifice)}
                    updateShareCount={updateShareCount || undefined}
                    setFormData={setFormData || (() => { })}
                    goToStep={(step) => goToStep?.(step as Step)}
                    resetStore={resetStore || (() => { })}
                    setLastInteractionTime={(time) => setLastInteractionTime?.(time)}
                    setTimeLeft={(value) => setTimeLeft?.(typeof value === 'function' ? value(timeLeft || 0) : value)}
                    handleApprove={handleApprove ? async () => await handleApprove() : async () => { }}
                    toast={(props) => toast?.(props) || (() => { })}
                    isLoading={isLoading || false}
                    serverTimeRemaining={serverTimeRemaining}
                />
            )}

            {/* Selection and Reservation Dialogs */}
            <SelectionDialogs
                tempSelectedSacrifice={tempSelectedSacrifice || null}
                isDialogOpen={!!isDialogOpen}
                setIsDialogOpen={(open) => setIsDialogOpen?.(open) || undefined}
                showReservationInfo={!!showReservationInfo}
                setShowReservationInfo={(show) => setShowReservationInfo?.(show) || undefined}
                handleShareCountSelect={async (count) => {
                    if (handleShareCountSelect) {
                        return Promise.resolve(handleShareCountSelect(count));
                    }
                    return Promise.resolve();
                }}
                handleReservationInfoClose={handleReservationInfoClose || (() => { })}
                isReservationLoading={!!isReservationLoading}
            />

            {/* Warning Dialogs */}
            <WarningDialogs
                showThreeMinuteWarning={!!showThreeMinuteWarning}
                setShowThreeMinuteWarning={(show) => setShowThreeMinuteWarning?.(show) || undefined}
                showOneMinuteWarning={!!showOneMinuteWarning}
                setShowOneMinuteWarning={(show) => setShowOneMinuteWarning?.(show) || undefined}
                handleDismissWarning={(warningType) => {
                    if (handleDismissWarning) {
                        return handleDismissWarning(warningType);
                    }
                    return undefined;
                }}
                getRemainingMinutesText={getRemainingMinutesText || (() => "")}
            />
        </div>
    );
}; 