import { StyleSheet } from "react-native";

export const TextStyle = StyleSheet.create({
  Display_L: {
    fontSize: 48,
    lineHeight: 60,
    fontWeight: "500",
  },
  Display_M: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "600",
  },
  Title_XXL: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "600",
  },
  Title_XL: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600",
  },
  Title_L: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "600",
  },
  Title_M: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "600",
  },
  Title_S1: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "600",
  },
  Title_S2: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "600",
  },
  Body_L2: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "400",
  },
  Body_L1: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "600",
  },
  Body_M2: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "400",
  },
  Body_M1: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "600",
  },
  Body_S1: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
  },
  Body_S2: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "400",
  },
  Caption_M3: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
  },
  Caption_M2: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  Caption_M1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
});

export type TTextStyle = typeof TextStyle;

export const getTextStyle = (type: keyof TTextStyle) => {
  return TextStyle[type];
};
