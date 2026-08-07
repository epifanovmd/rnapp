import { StyleSheet } from "react-native";

const absoluteFill = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
} as const;

export const DialogStyles = StyleSheet.create({
  overlay: {
    ...absoluteFill,
    zIndex: 99999,
  },
  topContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  backdrop: {
    ...absoluteFill,
  },
  card: {
    overflow: "hidden",
    padding: 16,
    borderRadius: 16,
    gap: 16,
  },
});
