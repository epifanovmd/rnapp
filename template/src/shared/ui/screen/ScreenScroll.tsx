import { useTheme } from "@shared/lib/theme";
import React, { FC, PropsWithChildren } from "react";
import { RefreshControl, StyleSheet } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface IScreenScrollProps {
  /** Pull-to-refresh: состояние и обработчик. */
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Доп. отступ снизу (таб-бар); safe-area добавляется сам. */
  bottomInset?: number;
  /** Отступ сверху (прозрачный навбар). */
  topInset?: number;
  gap?: number;
}

/** Прокручиваемый экран: отступы, клавиатура и pull-to-refresh. */
export const ScreenScroll: FC<PropsWithChildren<IScreenScrollProps>> = ({
  refreshing = false,
  onRefresh,
  bottomInset = 0,
  topInset = 0,
  gap = 12,
  children,
}) => {
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();

  return (
    <KeyboardAwareScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        {
          gap,
          paddingTop: 12 + topInset,
          paddingBottom: 16 + bottom + bottomInset,
        },
      ]}
      keyboardShouldPersistTaps={"handled"}
      showsVerticalScrollIndicator={false}
      bottomOffset={16}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.textSecondary}
            colors={[colors.primary]}
            progressViewOffset={topInset}
          />
        ) : undefined
      }
    >
      {children}
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
  },
});
