// Reservation durumları
export enum ReservationStatus {
    ACTIVE = 'active',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    CANCELED = 'canceled',
    TIMED_OUT = 'timed out',
    EXPIRED = 'expired'
}

// Rezervasyon veri tipi
export interface ReservationData {
    transaction_id: string;
    sacrifice_id: string;
    share_count: number;
    status?: ReservationStatus;
    created_at?: string;
    operation?: 'add' | 'remove' | 'update';
}

// Rezervasyon yanıt tipi
export interface ReservationResponse {
    success: boolean;
    message?: string;
    data?: {
        id: string;
        transaction_id: string;
        sacrifice_id: string;
        share_count: number;
        status: ReservationStatus;
        created_at: string;
        expires_at: string;
        timeRemaining?: number;
    };
    error?: string;
}

// Hisse güncelleme veri tipi
export interface UpdateShareCountData {
    transaction_id: string;
    share_count: number;
    operation: 'add' | 'remove' | 'update';
}

export interface UpdateShareCountResponse {
    success: boolean;
    message: string;
    data?: {
        transaction_id: string;
        share_count: number;
        updatedAt: string;
    };
    error?: string;
}

// Hissedar veri tipleri
export type FormDataType = {
    name: string;
    phone: string;
    delivery_location: string;
    is_purchaser?: boolean;
};

// API'ye gönderilmek üzere şekillendirilmiş veri yapısı
export interface ShareholderInput {
    shareholder_name: string;
    phone_number: string;
    transaction_id: string;
    sacrifice_id: string;
    share_price: number;
    delivery_fee?: number;
    delivery_location: string;
    security_code: string;
    purchased_by: string;
    last_edited_by: string;
    sacrifice_consent?: boolean;
    total_amount: number;
    remaining_payment: number;
    paid_amount?: number;
}

// Eski tip - geriye uyumluluk için korunuyor
export interface ShareholderData {
    transaction_id: string;
    sacrifice_id: string;
    shareholders: FormDataType[];
}

export interface ShareholderResponse {
    success: boolean;
    message: string;
    data?: any;
    error?: string;
}

// Daha genel bir mutation tipi tanımlayalım
export type GenericReservationMutation = {
    mutate: (data: any) => Promise<any>;
    mutateAsync: (data: any) => Promise<any>;
    isLoading?: boolean;
    isPending?: boolean;
    isFetching?: boolean;
    status: string;
    error?: Error | null;
    [key: string]: any; // Diğer özelliklere de izin verelim
};

// React Query mutation tipleri
export type CreateReservationMutation = {
    mutateAsync: (data: any) => Promise<any>;
    isLoading?: boolean;
    isPending?: boolean;
    isFetching?: boolean;
    status: string;
    [key: string]: any; // Diğer özelliklere de izin verelim
};

// UpdateShareCountMutation tipini daha esnek hale getirelim
export type UpdateShareCountMutation = {
    mutateAsync: (data: UpdateShareCountData) => Promise<any>;
    [key: string]: any; // Diğer özelliklere de izin verelim
};

// createShareholders artık gerçek API beklentisine uygun
export type CreateShareholdersMutation = {
    mutateAsync: (data: any) => Promise<any>;
    isLoading?: boolean;
    isPending?: boolean;
    isFetching?: boolean;
    status: string;
    error?: Error | null;
    [key: string]: any; // Diğer özelliklere de izin verelim
}; 