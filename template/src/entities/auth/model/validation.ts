import { isEmail, isPhone } from "@shared/lib/utils";
import { z } from "zod";

export const loginValidation = z
  .string({ message: "Введите email или номер телефона." })
  .refine(value => isEmail(value) || isPhone(value), {
    message: "Введите корректный email или номер телефона",
  });

export const passwordValidation = z
  .string({ message: "Введите пароль." })
  .min(6, { message: "Пароль должен быть не менее 6-ти символов." });
