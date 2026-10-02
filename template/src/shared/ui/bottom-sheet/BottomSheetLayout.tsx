import { useBottomSheetInternal } from "@gorhom/bottom-sheet";
import React, { ReactNode, useCallback, useEffect, useRef } from "react";
import { LayoutChangeEvent } from "react-native";
import Animated, { SharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ResolvedSingleSlot } from "../../lib/slots";
import { useSheetKeyboardLayout } from "./hooks/useSheetKeyboardLayout";
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
 * — по нему он считает свою видимую область на конец анимации.
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
    const fullHeight =
      contentH +
      paddingBottom +
      (hasHeader ? headerH + gap : 0) +
      (hasFooter ? footerH + gap : 0);

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
  ]);

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
