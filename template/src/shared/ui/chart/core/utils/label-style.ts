import { matchFont } from "@shopify/react-native-skia";

export type SkFont = ReturnType<typeof matchFont>;

export const LABEL_PADDING_X = 6;
export const LABEL_PADDING_Y = 3;
export const LABEL_GAP = 4;

export const defaultLabelFormatter = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);
