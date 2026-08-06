import {
  BottomSheetScrollView as GHBottomSheetScrollView,
  useBottomSheetInternal,
} from "@gorhom/bottom-sheet";
import React, { ComponentProps, forwardRef, PropsWithChildren } from "react";
import {
  LayoutChangeEvent,
  ScrollView as RNScrollView,
  View as RNView,
} from "react-native";
import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomSheetFooter } from "./BottomSheetFooter";
import { BottomSheetHeader } from "./BottomSheetHeader";
import { BottomSheetStyles } from "./styles";
import { TBottomSheetFooterProps, TBottomSheetHeaderProps } from "./types";

type TContentPropsWrap = PropsWithChildren<{
  header?: TBottomSheetHeaderProps;
  footer?: TBottomSheetFooterProps;
}>;

export type BottomSheetScrollViewProps = ComponentProps<
  typeof GHBottomSheetScrollView
> &
  TContentPropsWrap;

export const BottomSheetScrollView = forwardRef<
  RNScrollView,
  BottomSheetScrollViewProps
>(({ onContentSizeChange, header, footer, ...props }, ref) => {
  const headerH = useSharedValue(0);
  const footerH = useSharedValue(0);
  const contentH = useSharedValue(0);

  const { bottom: paddingBottom } = useSafeAreaInsets();
  const { enableDynamicSizing, animatedLayoutState } = useBottomSheetInternal();

  // Отслеживаем изменения высот в UI потоке
  useAnimatedReaction(
    () => ({
      header: headerH.value,
      footer: footerH.value,
      content: contentH.value,
    }),
    (current, previous) => {
      if (
        current.header !== previous?.header ||
        current.footer !== previous?.footer ||
        current.content !== previous?.content
      ) {
        if (enableDynamicSizing) {
          animatedLayoutState.modify(state => {
            state.contentHeight =
              contentH.value +
              (header ? headerH.value : 0) +
              (footer ? footerH.value : 0) +
              paddingBottom +
              (header ? BottomSheetStyles.content.gap : 0) +
              (footer ? BottomSheetStyles.content.gap : 0);

            return state;
          });
        }
      }
    },
    [enableDynamicSizing],
  );

  const handleContentSizeChange = (w: number, h: number) => {
    contentH.value = h;
  };

  const onHeaderLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    headerH.value = layout.height;
  };

  const onFooterLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    footerH.value = layout.height;
  };

  return (
    <RNView
      collapsable={false}
      style={[BottomSheetStyles.content, { paddingBottom }]}
    >
      {!!header && <BottomSheetHeader {...header} onLayout={onHeaderLayout} />}
      <GHBottomSheetScrollView
        ref={ref}
        {...props}
        onContentSizeChange={handleContentSizeChange}
      />
      {!!footer && <BottomSheetFooter {...footer} onLayout={onFooterLayout} />}
    </RNView>
  );
});
