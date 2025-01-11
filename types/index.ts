export type sacrificeSchema = {
  sacrifice_id: number;
  sacrifice_no: number;
  sacrifice_time: string;
  share_price: number;
  empty_share: number;
  notes: string;
  added_at: string;
  last_edited_by: string;
};

export type FormData = {
  shareholder_1?: string;
  shareholder_2?: string;
  shareholder_3?: string;
  shareholder_4?: string;
  shareholder_5?: string;
  shareholder_6?: string;
  shareholder_7?: string;
}