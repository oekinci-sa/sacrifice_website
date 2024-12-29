import { z } from "zod";

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const sacrificeSchema = z.object({
  sacrifice_no: z.number(),
  sacrifice_time: z.string(),
  share_price: z.number(),
  empty_share: z.number(),
  notes: z.string().nullable(),
  sacrifice_id: z.number(),
  added_at: z.string(),
});

export type Task = z.infer<typeof sacrificeSchema>;
