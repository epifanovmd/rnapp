import { TAnimatedNumber } from "@shared/lib/animation";
import { mergeRefs } from "@shared/lib/hooks/merge-refs";
import {
  KeyboardAwareContent,
  useKeyboardAwareScroll,
} from "@shared/lib/keyboard-aware";
import React, {
  ComponentPropsWithoutRef,
  ReactElement,
  ReactNode,
  Ref,
  useMemo,
} from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Animated, { useAnimatedRef } from "react-native-reanimated";

import { splitContentContainerStyle } from "./split-content-container-style";

export interface IKeyboardAwareScrollViewProps extends Omit<
  ComponentPropsWithoutRef<typeof Animated.ScrollView>,
  "contentContainerStyle" | "children"
> {
  ref?: Ref<Animated.ScrollView>;
  children?: ReactNode;
  /**
   * Стиль контента. Уходит обёртке детей (отступы, gap, выравнивание), у
   * самого контейнера остаётся только `flexGrow`: распорка под клавиатуру —
   * последний элемент контента, и после неё отступов быть не должно.
   * Только статичный стиль (не анимированный).
   */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Зазор между низом поля и клавиатурой, px. По умолчанию 16. */
  bottomOffset?: number;
  /** Перекрытие верха скролла (прозрачный навбар): поле не уводится под него. */
  topInset?: TAnimatedNumber;
  /**
   * При закрытии клавиатуры вернуть скролл к положению на момент её открытия,
   * если пользователь не скроллил сам. По умолчанию `true`.
   */
  restoreScrollOnKeyboardHide?: boolean;
  /** Выключить докрутку к полю и распорку. По умолчанию `true`. */
  enabled?: boolean;
  /**
   * Обёртка вокруг ScrollView (например `GestureDetector` протяжки — он
   * цепляется к прямому ребёнку). Обязана вернуть элемент ровно один раз.
   */
  renderScrollView?: (scrollView: ReactElement) => ReactElement;
}

/**
 * ScrollView с полями над клавиатурой: `useKeyboardAwareScroll` и
 * `KeyboardAwareContent` уже собраны. Поля кита регистрируются сами, поле
 * встаёт над клавиатурой целиком. `ref` объединяется с внутренним animated ref.
 *
 * ```tsx
 * <KeyboardAwareScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
 *   <TextField label={"Имя"} />
 * </KeyboardAwareScrollView>
 * ```
 */
export const KeyboardAwareScrollView = ({
  ref,
  contentContainerStyle,
  bottomOffset,
  topInset,
  restoreScrollOnKeyboardHide = true,
  enabled,
  renderScrollView,
  children,
  keyboardShouldPersistTaps = "handled",
  scrollEventThrottle = 16,
  ...rest
}: IKeyboardAwareScrollViewProps) => {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const keyboardAware = useKeyboardAwareScroll(scrollRef, {
    bottomOffset,
    topInset,
    enabled,
    restoreOnHide: restoreScrollOnKeyboardHide,
  });

  const mergedRef = useMemo(() => {
    const attach = (instance: Animated.ScrollView | null) => {
      scrollRef(instance);
    };

    return mergeRefs<Animated.ScrollView | null>(
      ref ? [ref, attach] : [attach],
    );
  }, [ref, scrollRef]);
  const { container, content } = useMemo(
    () => splitContentContainerStyle(StyleSheet.flatten(contentContainerStyle)),
    [contentContainerStyle],
  );

  const scrollView = (
    <Animated.ScrollView
      ref={mergedRef}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      scrollEventThrottle={scrollEventThrottle}
      contentContainerStyle={container}
      {...rest}
    >
      <KeyboardAwareContent controller={keyboardAware}>
        <View style={content}>{children}</View>
      </KeyboardAwareContent>
    </Animated.ScrollView>
  );

  return renderScrollView ? renderScrollView(scrollView) : scrollView;
};
