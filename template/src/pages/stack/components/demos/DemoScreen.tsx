import { KeyboardAwareScrollView } from "@shared/ui";
import React, { FC, PropsWithChildren } from "react";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface IDemoScreenProps {
  /**
   * При закрытии клавиатуры вернуть скролл к положению на момент её открытия,
   * если пользователь не скроллил сам. По умолчанию `true`.
   */
  restoreScrollOnKeyboardHide?: boolean;
}

/**
 * Скролл-обёртка демо-экрана: отступы контента, safe area снизу и поля
 * над клавиатурой (`KeyboardAwareScrollView`).
 */
export const DemoScreen: FC<PropsWithChildren<IDemoScreenProps>> = ({
  restoreScrollOnKeyboardHide = true,
  children,
}) => {
  const { bottom } = useSafeAreaInsets();

  return (
    <KeyboardAwareScrollView
      restoreScrollOnKeyboardHide={restoreScrollOnKeyboardHide}
      contentContainerStyle={[styles.content, { paddingBottom: bottom + 16 }]}
    >
      {children}
    </KeyboardAwareScrollView>
  );
};

export type { IDemoSectionProps } from "./DemoSection";
export { DemoSection } from "./DemoSection";

const styles = StyleSheet.create({
  content: {
    paddingTop: 16,
    paddingHorizontal: 16,
    gap: 24,
  },
});
