import { loginValidation } from "@entities/auth";
import { z } from "zod";

export const recoveryPasswordValidationSchema = z.object({
  login: loginValidation,
});

export type TRecoveryPasswordForm = z.infer<
  typeof recoveryPasswordValidationSchema
>;
