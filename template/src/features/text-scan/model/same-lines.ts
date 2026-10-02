/** Те же строки скана — состояние не обновляется, страница не перерисовывается. */
export const sameLines = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((line, index) => line === b[index]);
