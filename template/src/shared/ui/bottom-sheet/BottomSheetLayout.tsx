import { useBottomSheetInternal } from "@gorhom/bottom-sheet";
import React, { ReactNode, useCallback } from "react";
import { LayoutChangeEvent, View } from "react-native";
import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";
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
 */
export const BottomSheetLayout = ({
  children,
  content,
  footer,
  header,
}: BottomSheetLayoutProps) => {
  const headerH = useSharedValue(0);
  const footerH = useSharedValue(0);
  const contentH = useSharedValue(0);

  const { bottom: paddingBottom } = useSafeAreaInsets();
  const { enableDynamicSizing, animatedLayoutState } = useBottomSheetInternal();

  const hasHeader = header.present;
  const hasFooter = footer.present;

  useAnimatedReaction(
    () => ({
      header: headerH.value,
      footer: footerH.value,
      content: contentH.value,
    }),
    (current, previous) => {
      if (
        !enableDynamicSizing ||
        (current.header === previous?.header &&
          current.footer === previous?.footer &&
          current.content === previous?.content)
      ) {
        return;
      }

      const gap = BottomSheetStyles.content.gap;

      animatedLayoutState.modify(state => {
        state.contentHeight =
          current.content +
          paddingBottom +
          (hasHeader ? current.header + gap : 0) +
          (hasFooter ? current.footer + gap : 0);

        return state;
      });
    },
    [enableDynamicSizing, hasHeader, hasFooter, paddingBottom],
  );

  const onContentSizeChange = useCallback(
    (_width: number, height: number) => {
      contentH.value = height;
    },
    [contentH],
  );

  const onHeaderLayout = useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      headerH.value = layout.height;
    },
    [headerH],
  );

  const onFooterLayout = useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      footerH.value = layout.height;
    },
    [footerH],
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
