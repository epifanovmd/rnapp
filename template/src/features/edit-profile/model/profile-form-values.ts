import type {
  IProfileUpdateRequestDto,
  ProfileDto,
} from "@shared/api/gen/main/model";
import { format, isValid, parse } from "date-fns";

import type { TProfileForm } from "./validation";

type TProfileSource = Partial<
  Pick<ProfileDto, "firstName" | "lastName" | "gender" | "birthDate" | "locale">
>;

const DATE_FORMAT = "yyyy-MM-dd";

/** Календарная дата `ГГГГ-ММ-ДД` (с временем или без) → локальная полночь; мусор — `null`. */
const parseBirthDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;

  const date = parse(value.slice(0, 10), DATE_FORMAT, new Date());

  return isValid(date) ? date : null;
};

/** Значения формы из профиля: пустые строки и `null` вместо отсутствующих полей. */
export const toProfileFormValues = (
  profile: TProfileSource | null | undefined,
): TProfileForm => ({
  firstName: profile?.firstName ?? "",
  lastName: profile?.lastName ?? "",
  gender: profile?.gender ?? "",
  birthDate: parseBirthDate(profile?.birthDate),
  locale: profile?.locale ?? "",
});

/**
 * Запрос обновления профиля: пустые поля — `null` (поле очищается), дата —
 * календарная `ГГГГ-ММ-ДД` в локальной зоне, без сдвига в UTC.
 */
export const toProfileUpdate = (
  form: TProfileForm,
): IProfileUpdateRequestDto => ({
  firstName: form.firstName.trim() || null,
  lastName: form.lastName.trim() || null,
  gender: form.gender.trim() || null,
  birthDate: form.birthDate ? format(form.birthDate, DATE_FORMAT) : null,
  locale: form.locale.trim() || null,
});
