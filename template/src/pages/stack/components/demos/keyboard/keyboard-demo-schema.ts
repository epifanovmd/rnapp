import { z } from "zod";

/** Длинная форма для демо клавиатуры: профиль, адрес доставки, заказ. */
export const keyboardDemoSchema = z.object({
  firstName: z.string().trim().min(2, "Минимум 2 символа"),
  lastName: z.string().trim().min(2, "Минимум 2 символа"),
  email: z.string().trim().email("Некорректный email"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?\d{10,15}$/, "10–15 цифр, можно с «+» в начале"),
  company: z.string().trim(),
  city: z.string().trim().min(2, "Укажите город"),
  street: z.string().trim().min(3, "Укажите улицу"),
  house: z.string().trim().min(1, "Укажите дом"),
  apartment: z.string().trim(),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Индекс — 6 цифр"),
  orderNumber: z
    .string()
    .trim()
    .regex(/^[A-Z]{2}-\d{4}$/, "Формат: AB-1234"),
  comment: z.string().trim().max(500, "Не больше 500 символов"),
});

export type TKeyboardDemoForm = z.input<typeof keyboardDemoSchema>;
export type TKeyboardDemoFormResult = z.output<typeof keyboardDemoSchema>;

export const KEYBOARD_DEMO_DEFAULTS: TKeyboardDemoForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  city: "",
  street: "",
  house: "",
  apartment: "",
  postalCode: "",
  orderNumber: "",
  comment: "",
};
