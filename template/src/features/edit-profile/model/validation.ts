import { z } from "zod";

const optionalText = (max: number) =>
  z.string().max(max, { message: `Не длиннее ${max} символов.` });

export const profileFormValidationSchema = z.object({
  firstName: optionalText(40),
  lastName: optionalText(40),
  gender: optionalText(20),
  birthDate: z.date().nullable(),
  locale: optionalText(10),
});

export type TProfileForm = z.infer<typeof profileFormValidationSchema>;
