/**
 * Текст числового поля → значение формы: пустое — `null`, иначе число;
 * нечисловой ввод — `undefined` (поле не меняется).
 */
export const parseNumberInput = (
  text: string,
  allowDecimal = false,
): number | null | undefined => {
  const normalized = text.trim().replace(",", ".");

  if (!normalized) return null;

  const pattern = allowDecimal ? /^-?\d+(\.\d+)?$/ : /^-?\d+$/;

  return pattern.test(normalized) ? Number(normalized) : undefined;
};
