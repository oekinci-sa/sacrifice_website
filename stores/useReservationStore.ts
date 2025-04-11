import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { nanoid, customAlphabet } from 'nanoid';

// 16 karakter uzunluğunda bir ID oluşturacak özel nanoid fonksiyonu oluştur
// Alfabe veritabanı uyumluluğu için güvenli karakterleri içerir (rakamlar ve harfler)
const generateTransactionId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 16);

// Rezervasyon store tipi
interface ReservationState {
  transaction_id: string;
  resetTransactionId: () => void;
  generateNewTransactionId: () => void;
}

const initialState = {
  // Her oturum için benzersiz bir transaction_id ile başla - tam 16 karakter
  transaction_id: generateTransactionId(),
}

export const useReservationStore = create<ReservationState>()(
  devtools(
    (set) => ({
      ...initialState,
      
      // Transaction ID'yi sıfırla (yeni bir ID oluşturur)
      resetTransactionId: () => set({ transaction_id: generateTransactionId() }),
      
      // Yeni bir transaction ID oluştur
      generateNewTransactionId: () => set({ transaction_id: generateTransactionId() }),
    }),
    { name: 'reservation-store' }
  )
) 