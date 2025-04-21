import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public'
  }
})

// createRealtimeChannel yardımcı fonksiyonu ekle
export const createRealtimeChannel = (channelName: string, table: string, filter?: string) => {
  const channel = supabase
    .channel(`${channelName}-${Date.now()}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: table,
        ...(filter ? { filter } : {})
      },
      (payload) => {
        return payload;
      }
    );

  return channel;
}; 