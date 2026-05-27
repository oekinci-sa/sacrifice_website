import { supabase } from '@/utils/supabaseClient';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type CallbackFunction = (payload: RealtimePostgresChangesPayload<any>) => void;

type SubscribeOptions = {
    filter?: string;
};

const RealtimeManager = {
    activeChannels: [] as RealtimeChannel[],

    subscribeToTable(table: string, callback: CallbackFunction, options?: SubscribeOptions) {
        const channelName = `${table}-${Date.now()}`;

        const changeConfig: {
            event: '*';
            schema: 'public';
            table: string;
            filter?: string;
        } = { event: '*', schema: 'public', table };

        if (options?.filter) {
            changeConfig.filter = options.filter;
        }

        const channel = supabase
            .channel(channelName)
            .on('postgres_changes',
                changeConfig,
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