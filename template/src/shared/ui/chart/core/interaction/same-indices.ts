/** Те же ли индексы активных точек (worklet): мост в React — только при смене. */
export const sameIndices = (
  a: readonly number[] | null | undefined,
  b: readonly number[] | null | undefined,
): boolean => {
  "worklet";

  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;

  for (let index = 0; index < a.length; index++) {
    if (a[index] !== b[index]) return false;
  }

  return true;
};
