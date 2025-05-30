import React from "react";
import QueueCard from "./queue-card";
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

const QueueCardWithButtons = () => {
    return (
        <div className="flex flex-col items-center justify-center gap-8 md:gap-12">

            {/* Counter */}
            <div className="flex flex-row items-center justify-center gap-4 md:gap-8">
                <i className="bi bi-dash flex items-center justify-center text-xl md:text-2xl text-black/75 bg-black/5 hover:bg-sac-primary hover:text-white rounded-lg w-8 h-8 md:w-10 md:h-10 rounded rounded-md transition-all duration-200"></i>
                <QueueCard />
                <i className="bi bi-plus flex items-center justify-center text-xl md:text-2xl text-black/75 bg-black/5 hover:bg-sac-primary hover:text-white rounded-lg w-8 h-8 md:w-10 md:h-10 rounded rounded-md transition-all duration-200"></i>
            </div>

            {/* Switch */}
            <div className="flex items-center space-x-4 md:space-x-6">
                <Switch id="airplane-mode" />
                <Label className="text-black/75 text-lg md:text-xl" htmlFor="airplane-mode">Kesim gerçekleşti.</Label>
            </div>
        </div>
    );
};

export default QueueCardWithButtons;