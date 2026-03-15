import StageMetricsRealtimeProvider from "@/app/(takip)/components/stage-metrics-realtime-provider";
import TakipContent from "@/app/(takip)/(takip)/page-takip";

export default function OnizlemeTakipPage() {
  return (
    <StageMetricsRealtimeProvider>
      <TakipContent />
    </StageMetricsRealtimeProvider>
  );
}
