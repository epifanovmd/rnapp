import { loginValidation, passwordValidation } from "@entities/auth";
import { z } from "zod";

export const signInFormValidationSchema = z.object({
  login: loginValidation,
  password: passwordValidation,
});

export type TSignInForm = z.input<typeof signInFormValidationSchema>;
export type TSignInSubmit = z.output<typeof signInFormValidationSchema>;
