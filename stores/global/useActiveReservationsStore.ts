import { SACRIFICE_UPDATED_EVENT } from '@/stores/global/useSacrificeStore';
import RealtimeManager from '@/utils/RealtimeManager';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ActiveReservationsState {
    // sacrifice_id -> aktif işlem sayısı
    reservations: Record<string, number>;
    isLoading: boolean;
    error: Error | null;

    // Aktif rezervasyonları yükle
    fetchActiveReservations: () => Promise<void>;

    // Realtime abonelik
    subscribeToRealtimeReservations: () => void;
    unsubscribeFromRealtimeReservations: () => void;

    // Event listener methodları
    setupEventListeners: () => void;
    cleanupEventListeners: () => void;
}

export const useActiveReservationsStore = create<ActiveReservationsState>()(
    devtools(
        (set, get) => {
            // Event handler için referans tutacak değişken
            let activeReservationsHandler: (() => void) | null = null;

            return {
                reservations: {},
                isLoading: false,
                error: null,

                fetchActiveReservations: async () => {
                    set({ isLoading: true, error: null });

                    try {
                        const response = await fetch('/api/get-active-reservations');

                        if (!response.ok) {
                            throw new Error('Aktif rezervasyonlar alınamadı');
                        }

                        const data = await response.json();

                        // API'den dönen veriyi sacrifice_id'ye göre map'leyelim
                        const reservationMap: Record<string, number> = {};

                        data.forEach((reservation: { sacrifice_id: string; active_count: number }) => {
                            reservationMap[reservation.sacrifice_id] = reservation.active_count;
                        });

                        set({ reservations: reservationMap, isLoading: false });
                    } catch (error) {
                        console.error('Aktif rezervasyon verileri alınırken hata:', error);
                        set({
                            error: error instanceof Error ? error : new Error(String(error)),
                            isLoading: false
                        });
                    }
                },

                subscribeToRealtimeReservations: () => {
                    // Önce mevcut abonelikleri temizle
                    RealtimeManager.cleanup();

                    // Reservations tablosuna abone ol
                    RealtimeManager.subscribeToTable(
                        'reservations',
                        () => {
                            // Herhangi bir değişiklik olduğunda rezervasyonları yeniden yükle
                            get().fetchActiveReservations();
                        }
                    );

                    // Event listener'ları kur
                    get().setupEventListeners();
                },

                unsubscribeFromRealtimeReservations: () => {
                    // RealtimeManager temizliği
                    RealtimeManager.cleanup();

                    // Event listener temizliği
                    get().cleanupEventListeners();
                },

                setupEventListeners: () => {
                    // SACRIFICE_UPDATED_EVENT'e yanıt verecek fonksiyon
                    activeReservationsHandler = () => {
                        get().fetchActiveReservations();
                    };

                    // Event listener ekle
                    window.addEventListener(SACRIFICE_UPDATED_EVENT, activeReservationsHandler);
                },

                cleanupEventListeners: () => {
                    // Event listener'ı kaldır
                    if (activeReservationsHandler) {
                        window.removeEventListener(SACRIFICE_UPDATED_EVENT, activeReservationsHandler);
                        activeReservationsHandler = null;
                    }
                }
            };
        },
        { name: "active-reservations-store" }
    )
); 