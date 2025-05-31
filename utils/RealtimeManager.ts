import { supabase } from '@/utils/supabaseClient';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type CallbackFunction = (payload: RealtimePostgresChangesPayload<any>) => void;

const RealtimeManager = {
    activeChannels: [] as RealtimeChannel[],

    subscribeToTable(table: string, callback: CallbackFunction) {
        console.log(`[RealtimeManager] Creating subscription for table: ${table}`);
        console.log(`[RealtimeManager] Current active channels count: ${this.activeChannels.length}`);

        const channelName = `${table}-${Date.now()}`;
        console.log(`[RealtimeManager] Channel name: ${channelName}`);

        const channel = supabase
            .channel(channelName)
            .on('postgres_changes',
                { event: '*', schema: 'public', table },
                (payload: RealtimePostgresChangesPayload<any>) => {
                    console.log(`[RealtimeManager] Received real-time update for table ${table}:`, payload);
                    console.log(`[RealtimeManager] Event type: ${payload.eventType}`);
                    console.log(`[RealtimeManager] New data:`, payload.new);
                    console.log(`[RealtimeManager] Old data:`, payload.old);
                    callback(payload);
                }
            )
            .subscribe((status, err) => {
                console.log(`[RealtimeManager] Subscription status for ${table}:`, status);
                if (err) {
                    console.error(`[RealtimeManager] Subscription error for ${table}:`, err);
                } else {
                    console.log(`[RealtimeManager] Successfully subscribed to ${table}`);
                }
            });

        this.activeChannels.push(channel);
        console.log(`[RealtimeManager] Channel added. Total active channels: ${this.activeChannels.length}`);

        return channel;
    },

    cleanup() {
        console.log(`[RealtimeManager] Cleaning up ${this.activeChannels.length} active channels`);

        this.activeChannels.forEach((channel, index) => {
            console.log(`[RealtimeManager] Removing channel ${index + 1}/${this.activeChannels.length}`);
            supabase.removeChannel(channel);
        });

        this.activeChannels = [];
        console.log(`[RealtimeManager] Cleanup completed. Active channels: ${this.activeChannels.length}`);
    }
};

export default RealtimeManager; 