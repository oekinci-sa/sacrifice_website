import { supabase } from '@/utils/supabaseClient';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type CallbackFunction = (payload: RealtimePostgresChangesPayload<any>) => void;

const RealtimeManager = {
    activeChannels: [] as RealtimeChannel[],

    subscribeToTable(table: string, callback: CallbackFunction) {
        const channelName = `${table}-${Date.now()}`;

        const channel = supabase
            .channel(channelName)
            .on('postgres_changes',
                { event: '*', schema: 'public', table },
                (payload: RealtimePostgresChangesPayload<any>) => {
                    callback(payload);
                }
            )
            .subscribe();

        this.activeChannels.push(channel);

        return channel;
    },

    cleanup() {
        this.activeChannels.forEach((channel) => {
            supabase.removeChannel(channel);
        });
        this.activeChannels = [];
    }
};

export default RealtimeManager; 