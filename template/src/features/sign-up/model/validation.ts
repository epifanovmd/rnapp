import { loginValidation, passwordValidation } from "@entities/auth";
import { z } from "zod";

export const signUpFormValidationSchema = z
  .object({
    login: loginValidation,
    password: passwordValidation,
    confirmPassword: passwordValidation,
  })
  .refine(data => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Пароли не совпадают.",
  });

export type TSignUpForm = z.infer<typeof signUpFormValidationSchema>;
