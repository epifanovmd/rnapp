import { useBottomSheetInternal } from "@gorhom/bottom-sheet";
import { useKeyboardHeight } from "@shared/lib/keyboard";
import React, { ReactNode, useCallback, useEffect, useRef } from "react";
import { LayoutChangeEvent } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedReaction,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { ResolvedSingleSlot } from "../../lib/slots";
import { useSheetKeyboardLayout } from "./hooks/useSheetKeyboardLayout";
import { shouldDeferContentHeight } from "./sheet-keyboard-layout";
import { BottomSheetStyles } from "./styles";
import {
  TBottomSheetContentProps,
  TBottomSheetFooterProps,
  TBottomSheetHeaderProps,
} from "./types";

export interface BottomSheetLayoutProps {
  children?: ReactNode;
  content: ResolvedSingleSlot<TBottomSheetContentProps>;
  footer: ResolvedSingleSlot<TBottomSheetFooterProps>;
  header: ResolvedSingleSlot<TBottomSheetHeaderProps>;
  /** Сдвиг шторки над клавиатурой — его применяет контейнер модалки. */
  keyboardShift?: SharedValue<number>;
}

/**
 * Раскладка листа: слоты рендерятся здесь, потому что замер высот требует
 * контекста BottomSheetModal. Колбэки замера уходят в слоты инъекцией и не
 * затирают одноимённые props потребителя.
 *
 * Полная высота (контент + шапка + футер) пишется в animatedLayoutState одним
 * значением сразу после штатной записи BottomSheetScrollView (тот же JS-тик) и
 * только когда контент уже замерен — иначе detents пересчитываются на
 * промежуточных значениях и анимация открытия дёргается.
 *
 * Клавиатура — без gorhom (`useSheetKeyboardLayout`): шторка сдвигается и
 * ужимает нижним отступом область формы; в замер высоты для dynamic sizing
 * идёт отступ закрытого состояния. Скроллу контента уходит `containerShift`
 * — по нему он считает свою видимую область на конец анимации. Пока
 * клавиатура открыта, новая высота контента ждёт её закрытия: иначе gorhom
 * повёл бы шторку анимацией и на это время заблокировал скролл к полю.
 */
export const BottomSheetLayout = ({
  children,
  content,
  footer,
  header,
  keyboardShift,
}: BottomSheetLayoutProps) => {
  const { bottom: paddingBottom } = useSafeAreaInsets();
  const { enableDynamicSizing, animatedLayoutState } = useBottomSheetInternal();

  const hasHeader = header.present;
  const hasFooter = footer.present;

  const sizesRef = useRef({ header: 0, footer: 0, content: -1 });
  const { height: keyboardHeight } = useKeyboardHeight();
  /** Полная высота, отданная gorhom последней; -1 — ещё не отдавалась. */
  const committedRef = useRef(-1);
  /** Высота изменилась при открытой клавиатуре и ждёт её закрытия. */
  const deferredRef = useRef(false);
  const { paddingStyle, containerShift } = useSheetKeyboardLayout(
    paddingBottom,
    keyboardShift,
  );

  const commit = useCallback(() => {
    const {
      header: headerH,
      footer: footerH,
      content: contentH,
    } = sizesRef.current;

    // До первого замера контента не пишем: штатная запись тоже ещё не было.
    if (!enableDynamicSizing || contentH < 0) {
      return;
    }

    const gap = BottomSheetStyles.content.gap;
    const measuredHeight =
      contentH +
      paddingBottom +
      (hasHeader ? headerH + gap : 0) +
      (hasFooter ? footerH + gap : 0);
    const deferred = shouldDeferContentHeight({
      keyboardOpen: keyboardHeight.value > 0,
      hasCommitted: committedRef.current >= 0,
    });

    deferredRef.current = deferred;

    // Отложенная высота — прежняя, но записывается всё равно: штатная запись
    // BottomSheetScrollView (только контент) иначе осталась бы последней, и
    // шторка сжалась бы.
    const fullHeight = deferred ? committedRef.current : measuredHeight;

    committedRef.current = fullHeight;

    animatedLayoutState.modify(state => {
      "worklet";
      state.contentHeight = fullHeight;

      return state;
    });
  }, [
    enableDynamicSizing,
    paddingBottom,
    hasHeader,
    hasFooter,
    animatedLayoutState,
    keyboardHeight,
  ]);

  const flushDeferred = useCallback(() => {
    if (deferredRef.current) commit();
  }, [commit]);

  // Клавиатура закрылась — отложенная высота уходит gorhom.
  useAnimatedReaction(
    () => keyboardHeight.value > 0,
    (open, previous) => {
      if (previous && !open) scheduleOnRN(flushDeferred);
    },
  );

  // Изменение insets/наличия слотов меняет формулу — перезаписать высоту.
  useEffect(() => {
    commit();
  }, [commit]);

  const onContentSizeChange = useCallback(
    (_width: number, height: number) => {
      sizesRef.current.content = height;
      commit();
    },
    [commit],
  );

  const onHeaderLayout = useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      sizesRef.current.header = layout.height;
      commit();
    },
    [commit],
  );

  const onFooterLayout = useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      sizesRef.current.footer = layout.height;
      commit();
    },
    [commit],
  );

  return (
    <Animated.View
      collapsable={false}
      style={[BottomSheetStyles.content, paddingStyle]}
    >
      {header.render({ inject: { onLayout: onHeaderLayout } })}
      {content.render({
        defaults: { children },
        inject: { onContentSizeChange, containerShift },
      })}
      {footer.render({ inject: { onLayout: onFooterLayout } })}
    </Animated.View>
  );
};
