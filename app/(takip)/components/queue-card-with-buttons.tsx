'use client';

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useStageMetricsStore } from "@/stores/global/useStageMetricsStore";
import { StageType } from "@/types/stage-metrics";
import React, { useCallback, useEffect, useState } from "react";

interface QueueCardWithButtonsProps {
    title: string;
    stage: StageType;
}

interface SacrificeTimingData {
    slaughter_completed: boolean;
    butcher_completed: boolean;
    delivery_completed: boolean;
    slaughter_time: string | null;
    butcher_time: string | null;
    delivery_time: string | null;
}

const QueueCardWithButtons: React.FC<QueueCardWithButtonsProps> = ({ title, stage }) => {
    const [isCompleted, setIsCompleted] = useState(false);
    const [localNumber, setLocalNumber] = useState<number>(0);
    const [isSwitchDisabled, setIsSwitchDisabled] = useState(false);

    // Direct store subscription - this will trigger React re-renders
    const currentStageMetric = useStageMetricsStore(state => state.stageMetrics[stage]);
    const dbNumber = currentStageMetric?.current_sacrifice_number || 0;

    // Function to check if switch should be on and enabled based on database
    const checkSwitchState = useCallback(async (number: number) => {
        try {
            const sacrificeId = `SAC${number.toString().padStart(3, '0')}`;
            const response = await fetch(`/api/check-sacrifice-timing?sacrifice_id=${sacrificeId}`);
            const data: SacrificeTimingData = await response.json();

            if (response.ok) {
                // Set completion status based on current stage
                let currentStageCompleted = false;
                let canBeEnabled = true;

                switch (stage) {
                    case 'slaughter_stage':
                        currentStageCompleted = data.slaughter_completed;
                        canBeEnabled = true; // Slaughter can always be enabled
                        break;
                    case 'butcher_stage':
                        currentStageCompleted = data.butcher_completed;
                        canBeEnabled = data.slaughter_completed; // Butcher requires slaughter to be completed
                        break;
                    case 'delivery_stage':
                        currentStageCompleted = data.delivery_completed;
                        canBeEnabled = data.slaughter_completed && data.butcher_completed; // Delivery requires both slaughter and butcher
                        break;
                }

                setIsCompleted(currentStageCompleted);
                setIsSwitchDisabled(!canBeEnabled);
            }
        } catch (error) {
            console.error(`Error checking switch state for ${stage}:`, error);
        }
    }, [stage]);

    // Update local number when store data changes
    useEffect(() => {
        if (currentStageMetric && currentStageMetric.current_sacrifice_number !== undefined) {
            const newDbNumber = currentStageMetric.current_sacrifice_number;

            // Only update localNumber if it's currently synced with previous dbNumber or is initial load
            if (localNumber === 0 || localNumber === dbNumber) {
                setLocalNumber(newDbNumber);
                // Check switch state for the new number
                checkSwitchState(newDbNumber);
            }
        }
    }, [currentStageMetric, dbNumber, localNumber, checkSwitchState]);

    // Initial setup - check switch state for the initial number
    useEffect(() => {
        if (localNumber > 0) {
            checkSwitchState(localNumber);
        }
    }, [localNumber, checkSwitchState]);

    const handleDecrement = async () => {
        const newNumber = Math.max(0, localNumber - 1);
        setLocalNumber(newNumber);
        // Check switch state for the new number
        await checkSwitchState(newNumber);
    };

    const handleIncrement = async () => {
        // Limit to maximum 135
        const newNumber = Math.min(135, localNumber + 1);
        setLocalNumber(newNumber);
        // Check switch state for the new number
        await checkSwitchState(newNumber);
    };

    const handleSwitchChange = async (checked: boolean) => {
        if (isSwitchDisabled) return;

        setIsCompleted(checked);

        // Generate sacrifice_id based on current local number
        const sacrificeId = `SAC${localNumber.toString().padStart(3, '0')}`;

        try {
            await fetch('/api/update-sacrifice-timing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sacrifice_id: sacrificeId,
                    stage,
                    is_completed: checked
                })
            });
        } catch (error) {
            console.error(`Error updating sacrifice timing for ${stage}:`, error);
        }
    };

    // Get display text based on stage and completion status
    const getDisplayText = () => {
        let action = '';
        switch (stage) {
            case 'slaughter_stage':
                action = 'Kesim';
                break;
            case 'butcher_stage':
                action = 'Parçalama';
                break;
            case 'delivery_stage':
                action = 'Teslimat';
                break;
        }

        if (isSwitchDisabled) {
            return {
                main: `${action} yapılamaz`,
                sub: '*Önceki aşama tamamlanmamış.'
            };
        }

        return {
            main: `${action} ${isCompleted ? 'yapıldı' : 'yapılmadı'}.`,
            sub: null
        };
    };

    const displayText = getDisplayText();

    return (
        <div className="flex flex-col items-center justify-center gap-8 md:gap-12">
            {/* Counter */}
            <div className="flex flex-row items-center justify-center gap-6 md:gap-8">
                <i
                    className="bi bi-dash flex items-center justify-center text-3xl md:text-2xl text-black/75 bg-black/5 hover:bg-sac-primary hover:text-white rounded-lg w-10 h-10 md:w-12 md:h-12 rounded rounded-md transition-all duration-200 cursor-pointer"
                    onClick={handleDecrement}
                ></i>

                {/* Custom QueueCard that shows local number - styling fixed to not change with switch state */}
                <div className="flex flex-col items-center justify-center gap-4">
                    <div className='flex flex-col items-center justify-center w-40 md:w-60'>
                        <div className="bg-sac-primary py-1 md:py-2 text-center text-white w-full text-lg md:text-2xl font-bold">
                            {title}
                        </div>
                        <div className="py-4 md:py-8 text-center text-white w-full text-6xl md:text-8xl font-bold bg-black/90">
                            {localNumber}
                        </div>
                    </div>
                </div>

                <i
                    className="bi bi-plus flex items-center justify-center text-3xl md:text-2xl text-black/75 bg-black/5 hover:bg-sac-primary hover:text-white rounded-lg w-10 h-10 md:w-12 md:h-12 rounded rounded-md transition-all duration-200 cursor-pointer"
                    onClick={handleIncrement}
                ></i>
            </div>

            {/* Switch */}
            <div className="flex items-start space-x-4 md:space-x-6">
                <div className="transform scale-110 md:scale-125 origin-left">
                    <Switch
                        id="completion-switch"
                        checked={isCompleted}
                        disabled={isSwitchDisabled}
                        onCheckedChange={handleSwitchChange}
                        className="mt-1"
                    />
                </div>
                <div className="flex flex-col">
                    <Label
                        className={`text-lg md:text-xl ${isSwitchDisabled ? 'text-gray-400' : 'text-black/75'}`}
                        htmlFor="completion-switch"
                    >
                        {displayText.main}
                    </Label>
                    {displayText.sub && (
                        <span className={`text-sm md:text-base ${isSwitchDisabled ? 'text-gray-300' : 'text-gray-500'} mt-1`}>
                            {displayText.sub}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QueueCardWithButtons;