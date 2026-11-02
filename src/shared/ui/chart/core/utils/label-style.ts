import { matchFont } from "@shopify/react-native-skia";

export type SkFont = ReturnType<typeof matchFont>;

/** Отступ по X внутри подписи. */
export const LABEL_PADDING_X = 6;
/** Отступ по Y внутри подписи. */
export const LABEL_PADDING_Y = 3;
/** Зазор между подписями. */
export const LABEL_GAP = 4;

export const defaultLabelFormatter = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);
