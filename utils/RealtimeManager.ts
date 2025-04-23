import { supabase } from '@/utils/supabaseClient';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type CallbackFunction = (payload: RealtimePostgresChangesPayload<any>) => void;

const RealtimeManager = {
    activeChannels: [] as RealtimeChannel[],

    subscribeToTable(table: string, callback: CallbackFunction) {
        const channel = supabase
            .channel(`${table}-${Date.now()}`)
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
        this.activeChannels.forEach(channel => {
            supabase.removeChannel(channel);
        });
        this.activeChannels = [];
    }
};

export default RealtimeManager; 