import { loginValidation, passwordValidation } from "@entities/auth";
import { z } from "zod";

const nameValidation = z
  .string()
  .max(40, { message: "Не длиннее 40 символов." })
  .optional();

export const signUpFormValidationSchema = z
  .object({
    firstName: nameValidation,
    lastName: nameValidation,
    login: loginValidation,
    password: passwordValidation,
    confirmPassword: passwordValidation,
  })
  .refine(data => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Пароли не совпадают.",
  });

export type TSignUpForm = z.input<typeof signUpFormValidationSchema>;
export type TSignUpSubmit = z.output<typeof signUpFormValidationSchema>;
