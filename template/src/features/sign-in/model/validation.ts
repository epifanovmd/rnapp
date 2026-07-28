import { loginValidation, passwordValidation } from "@entities/auth";
import { z } from "zod";

export const signInFormValidationSchema = z.object({
  login: loginValidation,
  password: passwordValidation,
});

export type TSignInForm = z.infer<typeof signInFormValidationSchema>;
