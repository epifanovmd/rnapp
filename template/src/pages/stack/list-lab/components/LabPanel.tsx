import { useTheme } from "@shared/lib/theme";
import React, { FC, memo, ReactNode } from "react";
import { StyleSheet, View } from "react-native";

interface ILabPanelProps {
  children: ReactNode;
}

/** Панель управления стендом — поверх списка, чтобы не влиять на его раскладку. */
export const LabPanel: FC<ILabPanelProps> = memo(({ children }) => {
  const { isDark } = useTheme();

  return (
    <View style={[ss.panel, isDark ? ss.panelDark : ss.panelLight]}>
      {children}
    </View>
  );
});

LabPanel.displayName = "LabPanel";

const ss = StyleSheet.create({
  panel: { borderRadius: 12, margin: 8, padding: 10 },
  panelDark: { backgroundColor: "#22262C" },
  panelLight: { backgroundColor: "#F3F5F8" },
});
