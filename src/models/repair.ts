import { z } from "zod";

export const RepairSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  assignedTo: z.string(),
  date: z.string(),
  image: z.string(),
});

export type Repair = z.infer<typeof RepairSchema>;
