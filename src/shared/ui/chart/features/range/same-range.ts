/** Тот же ли выбранный диапазон индексов; вызывается из worklet-реакции. */
export const sameRange = (
  a: number[] | null,
  b: number[] | null | undefined,
) => {
  "worklet";

  return a === b || (!!a && !!b && a[0] === b[0] && a[1] === b[1]);
};
