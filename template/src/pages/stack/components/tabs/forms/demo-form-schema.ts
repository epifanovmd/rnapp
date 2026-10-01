import type { SegmentedOption, SelectOption } from "@shared/ui";
import { z } from "zod";

export const PLAN_OPTIONS: SegmentedOption<"free" | "pro" | "team">[] = [
  { label: "Free", value: "free", description: "1 сервер, без поддержки" },
  { label: "Pro", value: "pro", description: "До 10 серверов" },
  { label: "Team", value: "team", description: "Без лимитов, SSO" },
];

export const ROLE_OPTIONS: SelectOption[] = [
  { label: "Администратор", value: "admin", description: "Полный доступ" },
  { label: "Оператор", value: "operator", description: "Управление серверами" },
  { label: "Наблюдатель", value: "viewer", description: "Только чтение" },
  { label: "Гость", value: "guest", disabled: true },
];

export const CITY_OPTIONS: SelectOption[] = [
  "Амстердам",
  "Белград",
  "Берлин",
  "Варшава",
  "Вена",
  "Вильнюс",
  "Дублин",
  "Киев",
  "Лиссабон",
  "Лондон",
  "Мадрид",
  "Милан",
  "Москва",
  "Нью-Йорк",
  "Париж",
  "Прага",
  "Рига",
  "Сингапур",
  "Стамбул",
  "Стокгольм",
  "Таллин",
  "Токио",
  "Франкфурт",
  "Хельсинки",
  "Цюрих",
].map(city => ({ label: city, value: city }));

export const demoFormSchema = z.object({
  name: z.string().trim().min(2, "Минимум 2 символа"),
  plan: z.enum(["free", "pro", "team"]),
  role: z
    .string()
    .nullable()
    .refine(value => value !== null, "Выберите роль"),
  city: z.string().nullable(),
  tags: z.array(z.string()).min(1, "Выберите хотя бы один тег"),
  email: z.string().trim().email("Некорректный email"),
  seats: z
    .number()
    .int("Только целое")
    .min(1, "Минимум 1")
    .max(100, "Максимум 100")
    .nullable()
    .refine(value => value !== null, "Укажите число мест"),
  expiresAt: z.date().nullable(),
  notify: z.boolean(),
});

export type TDemoForm = z.input<typeof demoFormSchema>;
export type TDemoFormResult = z.output<typeof demoFormSchema>;

export const DEMO_FORM_DEFAULTS: TDemoForm = {
  name: "",
  plan: "free",
  role: null,
  city: null,
  tags: [],
  email: "",
  seats: null,
  expiresAt: null,
  notify: true,
};
