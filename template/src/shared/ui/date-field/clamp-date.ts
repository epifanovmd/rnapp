/** Дата в пределах `[min, max]`; границы необязательны. */
export const clampDate = (date: Date, min?: Date, max?: Date): Date => {
  if (min && date.getTime() < min.getTime()) return new Date(min);
  if (max && date.getTime() > max.getTime()) return new Date(max);

  return date;
};
