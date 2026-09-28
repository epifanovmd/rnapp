import { FlexProps, FlexStyle } from "../types";

type FlexStyleKeys = readonly (keyof FlexStyle)[];

/**
 * Пропсы view-слоя, транслируемые в style прямым переименованием
 * (без функций-трансформеров и промежуточных объектов).
 */
export const viewStyleKeysMap = {
  paddingLeft: ["paddingLeft"],
  pl: ["paddingLeft"],
  paddingRight: ["paddingRight"],
  pr: ["paddingRight"],
  paddingTop: ["paddingTop"],
  pt: ["paddingTop"],
  paddingBottom: ["paddingBottom"],
  pb: ["paddingBottom"],
  paddingVertical: ["paddingVertical"],
  pv: ["paddingVertical"],
  paddingHorizontal: ["paddingHorizontal"],
  ph: ["paddingHorizontal"],
  padding: ["padding"],
  pa: ["padding"],
  paddingStart: ["paddingStart"],
  paddingEnd: ["paddingEnd"],

  marginLeft: ["marginLeft"],
  ml: ["marginLeft"],
  marginRight: ["marginRight"],
  mr: ["marginRight"],
  marginTop: ["marginTop"],
  mt: ["marginTop"],
  marginBottom: ["marginBottom"],
  mb: ["marginBottom"],
  marginVertical: ["marginVertical"],
  mv: ["marginVertical"],
  marginHorizontal: ["marginHorizontal"],
  mh: ["marginHorizontal"],
  margin: ["margin"],
  ma: ["margin"],

  left: ["left"],
  right: ["right"],
  top: ["top"],
  bottom: ["bottom"],

  height: ["height"],
  minHeight: ["minHeight"],
  maxHeight: ["maxHeight"],
  width: ["width"],
  minWidth: ["minWidth"],
  maxWidth: ["maxWidth"],

  flex: ["flex"],
  flexGrow: ["flexGrow"],
  flexBasis: ["flexBasis"],
  flexWrap: ["flexWrap"],
  flexShrink: ["flexShrink"],
  gap: ["gap"],

  row: ["flexDirection"],
  col: ["flexDirection"],
  wrap: ["flexWrap"],

  alignItems: ["alignItems"],
  alignSelf: ["alignSelf"],
  justifyContent: ["justifyContent"],
  centerContent: ["alignItems", "justifyContent"],
  alignContent: ["alignContent"],

  absolute: ["position"],
  zIndex: ["zIndex"],

  radius: ["borderRadius"],
  topRadius: ["borderTopLeftRadius", "borderTopRightRadius"],
  bottomRadius: ["borderBottomLeftRadius", "borderBottomRightRadius"],
  leftRadius: ["borderBottomLeftRadius", "borderTopLeftRadius"],
  rightRadius: ["borderBottomRightRadius", "borderTopRightRadius"],

  overflow: ["overflow"],
  borderColor: ["borderColor"],
  borderWidth: ["borderWidth"],
  borderBottomWidth: ["borderBottomWidth"],
  borderTopWidth: ["borderTopWidth"],
  borderLeftWidth: ["borderLeftWidth"],
  borderRightWidth: ["borderRightWidth"],

  bg: ["backgroundColor"],
  opacity: ["opacity"],
} as const satisfies Record<string, FlexStyleKeys>;

/**
 * Текстовые пропсы поверх view-карты — используется Text-компонентами
 * (useTextFlexProps).
 */
export const textStyleKeysMap = {
  ...viewStyleKeysMap,
  color: ["color"],
  fontFamily: ["fontFamily"],
  fontSize: ["fontSize"],
  fontStyle: ["fontStyle"],
  fontWeight: ["fontWeight"],
  letterSpacing: ["letterSpacing"],
  lineHeight: ["lineHeight"],
  textAlign: ["textAlign"],
  textDecorationLine: ["textDecorationLine"],
  textDecorationStyle: ["textDecorationStyle"],
  textDecorationColor: ["textDecorationColor"],
  textTransform: ["textTransform"],
} as const satisfies Record<string, FlexStyleKeys>;

export type TStyleKeysMap = Record<string, FlexStyleKeys>;

/** Значения, подставляемые вместо boolean (<Col flex /> → flex: 1). */
export const flexBooleanValuesMap: Record<string, unknown> = {
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  height: "100%",
  width: "100%",
  flex: 1,
  flexGrow: 1,
  flexShrink: 1,
  row: "row",
  col: "column",
  wrap: "wrap",
  centerContent: "center",
  absolute: "absolute",
};

/** Пропсы, значение которых резолвится через цвета темы. */
export const themeColorFlexPropsSet = new Set([
  "bg",
  "color",
  "borderColor",
  "textDecorationColor",
]);

/** Пропсы, накапливаемые в style.transform. */
export const transformFlexPropsSet = new Set([
  "rotate",
  "translateX",
  "translateY",
  "scale",
]);

// пропсы с нетривиальной трансформацией — обрабатываются в конвертере явно
type SpecialFlexPropKeys =
  | "style"
  | "rotate"
  | "translateX"
  | "translateY"
  | "scale"
  | "absoluteFill"
  | "circle"
  | "elevation"
  | "debug";

// проверка, все ли ключи FlexProps включены в мапу
type LostFlexPropsKeys =
  Exclude<
    keyof FlexProps<FlexStyle>,
    SpecialFlexPropKeys | keyof typeof textStyleKeysMap
  > extends never
    ? true
    : false;

const CheckError: LostFlexPropsKeys = true;
