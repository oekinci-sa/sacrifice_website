'use client';

import { DeliveryShareInfoForm } from "@/app/(takip)/components/delivery-share-info-form";
import { SacrificeShareholdersCard } from "@/app/(takip)/components/sacrifice-shareholders-card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import {
  normalizeQueueDisplayNumber,
  QUEUE_NUMBER_MIN,
} from "@/lib/queue-display-number";
import { formatTimeShort } from "@/lib/date-utils";
import { useStageMetricsStore } from "@/stores/global/useStageMetricsStore";
import { StageType } from "@/types/stage-metrics";
import { supabase } from "@/utils/supabaseClient";
import { ArrowRight, TriangleAlert } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface QueueCardWithButtonsProps {
    title: string;
    stage: StageType;
    enableAnimation?: boolean;
    /** Dışarıdan kurbanlık no değiştirme callback'i (arama çubuğundan) */
    onJumpTo?: (no: number) => void;
    /** Dışarıdan kontrol edilecek localNumber (lift state up için) */
    externalNumber?: number;
    /** localNumber değiştiğinde dışarıya bildir */
    onLocalNumberChange?: (no: number) => void;
}

interface SacrificeTimingData {
    slaughter_completed: boolean;
    butcher_completed: boolean;
    delivery_completed: boolean;
    slaughter_time: string | null;
    butcher_time: string | null;
    delivery_time: string | null;
}

function getStageCompletedTime(data: SacrificeTimingData, stage: StageType): string | null {
    switch (stage) {
        case "slaughter_stage":
            return data.slaughter_time;
        case "butcher_stage":
            return data.butcher_time;
        case "delivery_stage":
            return data.delivery_time;
        default:
            return null;
    }
}

const QueueCardWithButtons: React.FC<QueueCardWithButtonsProps> = ({
    title,
    stage,
    enableAnimation = false,
    externalNumber,
    onLocalNumberChange,
}) => {
    const [isCompleted, setIsCompleted] = useState(false);
    const [stageCompletedTime, setStageCompletedTime] = useState<string | null>(null);
    const [localNumber, setLocalNumberInternal] = useState<number>(
        externalNumber ?? QUEUE_NUMBER_MIN
    );
    const [isSwitchDisabled, setIsSwitchDisabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [jumpInput, setJumpInput] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const { toast } = useToast();
    const syncedDbNumberRef = useRef<number>(QUEUE_NUMBER_MIN);

    const localNumberRef = useRef<number>(externalNumber ?? QUEUE_NUMBER_MIN);

    const setLocalNumber = (n: number) => {
        localNumberRef.current = n;
        setLocalNumberInternal(n);
        onLocalNumberChange?.(n);
    };

    // Dışarıdan gelen externalNumber değiştiğinde sync et
    useEffect(() => {
        if (externalNumber !== undefined && externalNumber !== localNumberRef.current) {
            setLocalNumber(externalNumber);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [externalNumber]);

    const currentStageMetric = useStageMetricsStore(state => state.stageMetrics[stage]);
    const maxSacrificeNumber = useStageMetricsStore(state => state.maxSacrificeNumber);
    const normalizedDbNumber = normalizeQueueDisplayNumber(
        currentStageMetric?.current_sacrifice_number
    );

    const checkSwitchState = useCallback(async (number: number): Promise<boolean> => {
        if (!number || number < QUEUE_NUMBER_MIN) {
            setIsCompleted(false);
            setIsSwitchDisabled(true);
            return true;
        }
        try {
            const response = await fetch(`/api/check-sacrifice-timing?sacrifice_no=${number}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data: SacrificeTimingData = await response.json();

            let currentStageCompleted = false;
            let canBeEnabled = true;

            switch (stage) {
                case 'slaughter_stage':
                    currentStageCompleted = data.slaughter_completed;
                    canBeEnabled = true;
                    break;
                case 'butcher_stage':
                    currentStageCompleted = data.butcher_completed;
                    canBeEnabled = data.slaughter_completed;
                    break;
                case 'delivery_stage':
                    currentStageCompleted = data.delivery_completed;
                    canBeEnabled = data.slaughter_completed && data.butcher_completed;
                    break;
            }

            setIsCompleted(currentStageCompleted);
            setStageCompletedTime(
                currentStageCompleted ? getStageCompletedTime(data, stage) : null
            );
            setIsSwitchDisabled(!canBeEnabled);
            return true;
        } catch (error) {
            console.error(`Error checking switch state for ${stage}:`, error);
            toast({
                variant: "destructive",
                title: "Bağlantı Hatası",
                description: "Veritabanı ile bağlantı kurulamadı. Lütfen internet bağlantınızı kontrol edin.",
            });
            return false;
        }
    }, [stage, toast]);

    useEffect(() => {
        if (currentStageMetric?.current_sacrifice_number === undefined) return;

        const newDbNumber = normalizedDbNumber;
        const prev = localNumberRef.current;
        if (prev === syncedDbNumberRef.current || prev < QUEUE_NUMBER_MIN) {
            syncedDbNumberRef.current = newDbNumber;
            void checkSwitchState(newDbNumber);
            setLocalNumber(newDbNumber);
        } else {
            syncedDbNumberRef.current = newDbNumber;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStageMetric?.current_sacrifice_number, normalizedDbNumber, checkSwitchState]);

    useEffect(() => {
        if (localNumber >= QUEUE_NUMBER_MIN) {
            void checkSwitchState(localNumber);
        }
    }, [localNumber, checkSwitchState]);

    useEffect(() => {
        if (localNumber < QUEUE_NUMBER_MIN) return;

        const channelName = `sacrifice-timing-no${localNumber}-${stage}-${Date.now()}`;

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'sacrifice_animals',
                    filter: `sacrifice_no=eq.${localNumber}`
                },
                () => {
                    void checkSwitchState(localNumber);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [localNumber, stage, checkSwitchState]);

    const handleDecrement = async () => {
        if (isLoading) return;

        if (localNumber <= QUEUE_NUMBER_MIN) {
            toast({
                title: "Sınır",
                description: "Sıra numarası 1'den küçük olamaz.",
            });
            return;
        }

        const newNumber = localNumber - 1;
        setIsLoading(true);

        try {
            const success = await checkSwitchState(newNumber);
            if (success) {
                setLocalNumber(newNumber);
            } else {
                toast({
                    variant: "destructive",
                    title: "İşlem Başarısız",
                    description: "İnternet bağlantısı olmadığı için sıra numarası değiştirilemedi.",
                });
            }
        } catch {
            toast({
                variant: "destructive",
                title: "İşlem Başarısız",
                description: "Sayı güncellenirken bir hata oluştu.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleIncrement = async () => {
        if (isLoading) return;

        if (localNumber >= maxSacrificeNumber) {
            toast({
                title: "Sınır",
                description: `Bu tenant için en yüksek kurban numarası ${maxSacrificeNumber}. Daha fazla artırılamaz.`,
            });
            return;
        }

        const newNumber = localNumber + 1;
        setIsLoading(true);

        try {
            const success = await checkSwitchState(newNumber);
            if (success) {
                setLocalNumber(newNumber);
            } else {
                toast({
                    variant: "destructive",
                    title: "İşlem Başarısız",
                    description: "İnternet bağlantısı olmadığı için sıra numarası değiştirilemedi.",
                });
            }
        } catch {
            toast({
                variant: "destructive",
                title: "İşlem Başarısız",
                description: "Sayı güncellenirken bir hata oluştu.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSwitchChange = (checked: boolean) => {
        if (isSwitchDisabled || isLoading) return;
        if (checked) {
            void executeStageChange(true);
            return;
        }
        setConfirmOpen(true);
    };

    const handleConfirmDialogOpenChange = (open: boolean) => {
        setConfirmOpen(open);
    };

    const executeStageChange = async (checked: boolean) => {
        const previousState = isCompleted;
        setIsCompleted(checked);
        setIsLoading(true);

        try {
            const response = await fetch('/api/update-sacrifice-timing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sacrifice_no: localNumber,
                    stage,
                    is_completed: checked
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            await checkSwitchState(localNumber);

            const actionText = getActionText();
            toast({
                title: "Başarılı",
                description: `${actionText} durumu güncellendi.`,
            });

        } catch (error) {
            console.error(`Error updating sacrifice timing for ${stage}:`, error);
            setIsCompleted(previousState);
            toast({
                variant: "destructive",
                title: "Güncelleme Başarısız",
                description: "Güncelleme başarısız. İnternet bağlantınızı kontrol edip yeniden deneyiniz.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmStageChange = () => {
        setConfirmOpen(false);
        void executeStageChange(false);
    };

    const getActionText = () => {
        switch (stage) {
            case 'slaughter_stage':
                return 'Kesim';
            case 'butcher_stage':
                return 'Parçalama';
            case 'delivery_stage':
                return 'Teslimat';
            default:
                return 'İşlem';
        }
    };

    const getDisplayText = () => {
        const action = getActionText();

        if (isSwitchDisabled) {
            return {
                main: `${action} yapılamaz`,
                sub: '*Önceki aşama tamamlanmamış.'
            };
        }

        if (isCompleted) {
            const timeLabel =
                stageCompletedTime && formatTimeShort(stageCompletedTime) !== "-"
                    ? `: ${formatTimeShort(stageCompletedTime)}`
                    : "";
            return {
                main: `${action} yapıldı${timeLabel}`,
                sub: null,
            };
        }

        return {
            main: `${action} yapılmadı.`,
            sub: null,
        };
    };

    const displayText = getDisplayText();
    const actionText = getActionText();
    const confirmTitle = `${actionText} işareti kaldırılsın mı?`;
    const confirmDescription = `${localNumber} numaralı kurbanlık için ${actionText.toLocaleLowerCase('tr-TR')} tamamlandı işareti geri alınacak. Yanlışlıkla basmadığınızdan emin olun.`;

    const handleJump = async () => {
        const n = parseInt(jumpInput, 10);
        if (isNaN(n) || n < QUEUE_NUMBER_MIN) {
            toast({ title: "Geçersiz numara", description: "Lütfen geçerli bir kurbanlık numarası girin." });
            return;
        }
        setIsLoading(true);
        const success = await checkSwitchState(n);
        if (success) {
            setLocalNumber(n);
            setJumpInput("");
        } else {
            toast({ variant: "destructive", title: "Numara bulunamadı", description: "Bu numaraya ait kurbanlık bulunamadı." });
        }
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center gap-8 md:gap-12 w-full">
            <div className="flex flex-row items-center justify-center gap-6 md:gap-8">
                <i
                    className={`bi bi-dash flex items-center justify-center text-3xl md:text-2xl text-black/75 bg-black/5 hover:bg-primary hover:text-white rounded-lg w-10 h-10 md:w-12 md:h-12 rounded rounded-md transition-all duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    onClick={handleDecrement}
                ></i>

                <div className="flex flex-col items-center justify-center gap-4">
                    <div className='flex flex-col items-center justify-center w-40 md:w-60'>
                        <div className="bg-primary py-1 md:py-2 text-center text-white w-full text-lg md:text-2xl font-bold">
                            {title}
                        </div>
                        <div className={`py-4 md:py-8 text-center text-white w-full text-6xl md:text-8xl font-bold bg-black/90 ${enableAnimation ? 'transition-all duration-300' : ''
                            } ${isLoading ? 'opacity-50' : ''}`}>
                            {localNumber}
                        </div>
                    </div>
                </div>

                <i
                    className={`bi bi-plus flex items-center justify-center text-3xl md:text-2xl text-black/75 bg-black/5 hover:bg-primary hover:text-white rounded-lg w-10 h-10 md:w-12 md:h-12 rounded rounded-md transition-all duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    onClick={handleIncrement}
                ></i>
            </div>

            {/* Doğrudan kurbanlık no girişi */}
            <div className="flex items-center gap-2 [color-scheme:light]">
                <input
                    type="number"
                    min={1}
                    value={jumpInput}
                    onChange={(e) => setJumpInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void handleJump()}
                    placeholder="Kurbanlık no…"
                    className="h-9 w-32 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-gray-400"
                    disabled={isLoading}
                />
                <button
                    type="button"
                    onClick={() => void handleJump()}
                    disabled={isLoading || !jumpInput}
                    className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <ArrowRight className="h-4 w-4" />
                    Git
                </button>
            </div>

            <div className="flex items-start space-x-4 md:space-x-6">
                <div className={`transform scale-110 md:scale-125 origin-left transition-opacity ${isLoading ? 'opacity-50' : ''}`}>
                    <Switch
                        id="completion-switch"
                        checked={isCompleted}
                        disabled={isSwitchDisabled || isLoading}
                        onCheckedChange={handleSwitchChange}
                        className="mt-1"
                    />
                </div>
                <div className="flex flex-col">
                    <Label
                        className={`text-lg md:text-xl ${isSwitchDisabled || isLoading ? 'text-gray-400' : 'text-black/75'}`}
                        htmlFor="completion-switch"
                    >
                        {displayText.main}
                        {isLoading && <span className="ml-2 text-sm">Güncelleniyor...</span>}
                    </Label>
                    {displayText.sub && (
                        <span className={`text-sm md:text-base ${isSwitchDisabled ? 'text-gray-300' : 'text-gray-500'} mt-1`}>
                            {displayText.sub}
                        </span>
                    )}
                </div>
            </div>

            <AlertDialog open={confirmOpen} onOpenChange={handleConfirmDialogOpenChange}>
                <AlertDialogContent className="border-destructive/40 bg-red-50 sm:max-w-md [color-scheme:light]">
                    <AlertDialogHeader>
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/15">
                                <TriangleAlert className="h-5 w-5 text-destructive" />
                            </div>
                            <div className="space-y-2 text-left">
                                <AlertDialogTitle className="text-destructive">
                                    {confirmTitle}
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-sm text-red-950/80">
                                    {confirmDescription}
                                </AlertDialogDescription>
                            </div>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-gray-300 bg-white text-gray-900 hover:bg-gray-50">
                            İptal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleConfirmStageChange}
                        >
                            Evet, onayla
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {stage === 'delivery_stage' && (
                <DeliveryShareInfoForm sacrificeNo={localNumber} />
            )}

            <SacrificeShareholdersCard
                sacrificeNo={localNumber}
                showPayment={stage === 'delivery_stage'}
            />
        </div>
    );
};

export default QueueCardWithButtons;
