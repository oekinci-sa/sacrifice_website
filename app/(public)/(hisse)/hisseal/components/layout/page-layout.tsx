import { ColumnDef } from "@tanstack/react-table";
import { FormStep, ISacrifice } from "../../types";
import { SelectionDialogs } from "../dialogs/selection-dialogs";
import { WarningDialogs } from "../dialogs/warning-dialogs";
import { FormView } from "../process-state/form-view";
import { SuccessView } from "../success-state/success-view";

export interface PageLayoutProps {
    // Success state
    isSuccess: boolean;
    onPdfDownload: () => void;

    // Form state
    currentStep?: FormStep;
    tabValue?: string;
    timeLeft?: number;
    showWarning?: boolean;
    columns?: ColumnDef<ISacrifice>[];
    data?: ISacrifice[];
    selectedSacrifice?: ISacrifice | null;
    formData?: any;
    isLoading?: boolean;
    serverTimeRemaining?: number;

    // Form handlers
    onSacrificeSelect?: (sacrifice: ISacrifice) => void;
    updateShareCount?: (shareCount: number) => void;
    setFormData?: (data: any) => void;
    goToStep?: (step: FormStep) => void;
    resetStore?: () => void;
    setLastInteractionTime?: (time: number) => void;
    setTimeLeft?: (time: number) => void;
    handleApprove?: () => void;
    toast?: Toast;

    // Dialog states
    tempSelectedSacrifice?: ISacrifice | null;
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
    handleDismissWarning?: () => void;
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
                    currentStep={currentStep}
                    tabValue={tabValue}
                    timeLeft={timeLeft}
                    showWarning={showWarning}
                    columns={columns}
                    data={data}
                    selectedSacrifice={selectedSacrifice}
                    formData={formData}
                    onSacrificeSelect={onSacrificeSelect}
                    updateShareCount={updateShareCount}
                    setFormData={setFormData}
                    goToStep={goToStep}
                    resetStore={resetStore}
                    setLastInteractionTime={setLastInteractionTime}
                    setTimeLeft={setTimeLeft}
                    handleApprove={handleApprove}
                    toast={toast}
                    isLoading={isLoading}
                    serverTimeRemaining={serverTimeRemaining}
                />
            )}

            {/* Selection and Reservation Dialogs */}
            <SelectionDialogs
                tempSelectedSacrifice={tempSelectedSacrifice}
                isDialogOpen={isDialogOpen}
                setIsDialogOpen={setIsDialogOpen}
                showReservationInfo={showReservationInfo}
                setShowReservationInfo={setShowReservationInfo}
                handleShareCountSelect={handleShareCountSelect}
                handleReservationInfoClose={handleReservationInfoClose}
                isReservationLoading={isReservationLoading}
            />

            {/* Warning Dialogs */}
            <WarningDialogs
                showThreeMinuteWarning={showThreeMinuteWarning}
                setShowThreeMinuteWarning={setShowThreeMinuteWarning}
                showOneMinuteWarning={showOneMinuteWarning}
                setShowOneMinuteWarning={setShowOneMinuteWarning}
                handleDismissWarning={handleDismissWarning}
                getRemainingMinutesText={getRemainingMinutesText}
            />
        </div>
    );
}; 