import React, { FC, useMemo } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import { useKeyboardInset } from "../../lib/hooks/use-keyboard-inset";

/**
 * Анимированный отступ, равный высоте клавиатуры + safe area.
 *
 * - Без внешнего управления: сам отслеживает клавиатуру.
 * - С внешним `bottomInset`: использует переданное значение — для чата,
 *   где зоной управляет JsChatView (включая freeze/thaw).
 *
 * Использование на демо-странице со ScrollView:
 * ```tsx
 * <ScrollView>
 *   <Content />
 *   <KeyboardSpacer />
 * </ScrollView>
 * <KeyboardInputBar>...</KeyboardInputBar>
 * ```
 */

export interface IKeyboardSpacerProps {
  /** Внешнее управление — если не передан, отслеживает клавиатуру сам. */
  bottomInset?: SharedValue<number>;
}

export const KeyboardSpacer: FC<IKeyboardSpacerProps> = ({
  bottomInset: externalInset,
}) => {
  const { bottomInset: internalInset } = useKeyboardInset();
  const inset = externalInset ?? internalInset;

  const style = useAnimatedStyle(() => ({
    height: inset.value,
  }));

  return <Animated.View style={style} />;
};

KeyboardSpacer.displayName = "KeyboardSpacer";
