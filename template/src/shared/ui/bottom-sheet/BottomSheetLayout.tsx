import { useBottomSheetInternal } from "@gorhom/bottom-sheet";
import React, { ReactNode, useCallback, useEffect, useRef } from "react";
import { LayoutChangeEvent, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ResolvedSingleSlot } from "../../lib/slots";
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
 */
export const BottomSheetLayout = ({
  children,
  content,
  footer,
  header,
}: BottomSheetLayoutProps) => {
  const { bottom: paddingBottom } = useSafeAreaInsets();
  const { enableDynamicSizing, animatedLayoutState } = useBottomSheetInternal();

  const hasHeader = header.present;
  const hasFooter = footer.present;

  const sizesRef = useRef({ header: 0, footer: 0, content: -1 });

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
    <View
      collapsable={false}
      style={[BottomSheetStyles.content, { paddingBottom }]}
    >
      {header.render({ inject: { onLayout: onHeaderLayout } })}
      {content.render({
        defaults: { children },
        inject: { onContentSizeChange },
      })}
      {footer.render({ inject: { onLayout: onFooterLayout } })}
    </View>
  );
};
