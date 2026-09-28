import { z } from "zod";

const optionalText = (max: number) =>
  z.string().max(max, { message: `Не длиннее ${max} символов.` });

export const profileSchema = z.object({
  firstName: optionalText(40),
  lastName: optionalText(40),
  birthDate: z
    .string()
    .refine(value => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: "Формат даты: ГГГГ-ММ-ДД.",
    }),
  gender: optionalText(20),
  locale: optionalText(10),
});

export type TProfileForm = z.input<typeof profileSchema>;

/** Пустые поля формы уходят на сервер как `null` — поле очищается. */
export const toProfileUpdate = (form: TProfileForm) => ({
  firstName: form.firstName.trim() || null,
  lastName: form.lastName.trim() || null,
  birthDate: form.birthDate.trim() || null,
  gender: form.gender.trim() || null,
  locale: form.locale.trim() || null,
});
