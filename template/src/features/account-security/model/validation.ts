import { passwordValidation } from "@entities/auth";
import { z } from "zod";

const requiredPassword = z
  .string({ message: "Введите пароль." })
  .min(1, { message: "Введите пароль." });

export const changePasswordSchema = z
  .object({
    currentPassword: requiredPassword,
    newPassword: passwordValidation,
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Пароли не совпадают.",
  });

export type TChangePasswordForm = z.input<typeof changePasswordSchema>;
export type TChangePasswordSubmit = z.output<typeof changePasswordSchema>;

export const emailSchema = z.object({
  email: z.email({ message: "Введите корректный email." }),
});

export type TEmailForm = z.input<typeof emailSchema>;

export const codeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, { message: "Код — 6 цифр из письма." }),
});

export type TCodeForm = z.input<typeof codeSchema>;

export const usernameSchema = z.object({
  username: z.string().regex(/^[a-z0-9_]{5,32}$/, {
    message: "5–32 символа: строчная латиница, цифры, подчёркивание.",
  }),
});

export type TUsernameForm = z.input<typeof usernameSchema>;

export const enable2FASchema = z.object({
  currentPassword: requiredPassword,
  password: passwordValidation,
  hint: z.string().max(100).optional(),
});

export type TEnable2FAForm = z.input<typeof enable2FASchema>;
export type TEnable2FASubmit = z.output<typeof enable2FASchema>;

export const disable2FASchema = z.object({
  currentPassword: requiredPassword,
  password: requiredPassword,
});

export type TDisable2FAForm = z.input<typeof disable2FASchema>;

export const deleteAccountSchema = z.object({
  password: requiredPassword,
});

export type TDeleteAccountForm = z.input<typeof deleteAccountSchema>;
