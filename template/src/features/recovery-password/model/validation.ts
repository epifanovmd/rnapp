import { loginValidation } from "@entities/auth";
import { z } from "zod";

export const recoveryPasswordValidationSchema = z.object({
  login: loginValidation,
});

export type TRecoveryPasswordForm = z.input<
  typeof recoveryPasswordValidationSchema
>;
export type TRecoveryPasswordSubmit = z.output<
  typeof recoveryPasswordValidationSchema
>;
