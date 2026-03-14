import {
  ReservationData as ImportedReservationData,
  ReservationStatus,
} from "@/types/reservation";

export enum ReservationStatusLocal {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  CANCELED = "canceled",
  COMPLETED = "completed",
}

export interface ReservationData {
  id: string;
  name: string;
  email: string;
  phone: string;
  tcno: string;
  status: ReservationStatusLocal;
  sacrifice_id: string;
  share_count: number;
  group_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ReservationResponse {
  success: boolean;
  message: string;
  data: ImportedReservationData[];
  error?: string;
}

export interface ReservationStatusData {
  status: ReservationStatus;
  transaction_id: string;
  timeRemaining: number | null;
  expires_at: string | null;
  sacrifice_id: string;
  share_count: number;
}
