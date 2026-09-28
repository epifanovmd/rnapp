export type TImageLoadStatus = "loading" | "loaded" | "error";

/** Есть ли что грузить: require-ресурс или непустой url. */
export const hasImageSource = (
  source: string | number | null | undefined,
): boolean =>
  typeof source === "number" ||
  (typeof source === "string" && source.length > 0);

/** Стартовый статус: без источника грузить нечего — сразу ошибка. */
export const initialImageLoadStatus = (
  source: string | number | null | undefined,
): TImageLoadStatus => (hasImageSource(source) ? "loading" : "error");

/** Изображение рендерится, пока не случилась ошибка. */
export const shouldRenderImage = (status: TImageLoadStatus): boolean =>
  status !== "error";
