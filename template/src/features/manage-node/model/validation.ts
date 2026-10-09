import type { NodeDto } from "@shared/api/gen/main/model";
import { z } from "zod";

/** Имя хоста или IP-адрес (v4 или v6). */
const HOST = /^[a-zA-Z0-9.:_-]+$/;

export const nodeFormSchema = z.object({
  name: z.string().trim().min(1, "Введите название.").max(120),
  host: z
    .string()
    .trim()
    .max(255)
    .refine(host => !host || HOST.test(host), "Имя хоста или IP-адрес."),
  description: z.string().trim().max(2000),
});

export type TNodeForm = z.input<typeof nodeFormSchema>;
export type TNodeFormValues = z.output<typeof nodeFormSchema>;

export const EMPTY_NODE_FORM: TNodeForm = {
  name: "",
  host: "",
  description: "",
};

/** Значения формы по узлу. */
export const nodeFormValues = (node: NodeDto): TNodeForm => ({
  name: node.name,
  host: node.host ?? "",
  description: node.description ?? "",
});

/** Тело запроса: пустые адрес и описание — `null` (снять). */
export const nodeFormBody = (data: TNodeFormValues) => ({
  name: data.name,
  host: data.host || null,
  description: data.description || null,
});
