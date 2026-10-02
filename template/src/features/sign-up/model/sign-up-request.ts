import type { TSignUpRequestDto } from "@shared/api/gen/main/model";
import { isEmail, isPhone } from "@shared/lib/utils";

import type { TSignUpSubmit } from "./validation";

/**
 * Запрос регистрации из формы: логин уходит как email или телефон, пустые
 * имя и фамилия не отправляются. Логин не email и не телефон — `null`.
 */
export const toSignUpRequest = (
  data: TSignUpSubmit,
): TSignUpRequestDto | null => {
  const names = {
    firstName: data.firstName?.trim() || undefined,
    lastName: data.lastName?.trim() || undefined,
  };

  if (isEmail(data.login)) {
    return { email: data.login, password: data.password, ...names };
  }

  if (isPhone(data.login)) {
    return { phone: data.login, password: data.password, ...names };
  }

  return null;
};
