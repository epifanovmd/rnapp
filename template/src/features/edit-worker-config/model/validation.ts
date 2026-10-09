import { jsonTextSchema } from "@entities/agent";
import { z } from "zod";

export const workerConfigSchema = z.object({
  value: jsonTextSchema.refine(text => text.trim() !== "", "Введите JSON."),
});

export type TWorkerConfigForm = z.input<typeof workerConfigSchema>;
