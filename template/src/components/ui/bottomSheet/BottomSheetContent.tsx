import {
  createBottomSheetScrollableComponent,
  SCROLLABLE_TYPE,
  useBottomSheetInternal,
} from "@gorhom/bottom-sheet";
import React, {
  ComponentProps,
  forwardRef,
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  LayoutChangeEvent,
  ScrollView as RNScrollView,
  ScrollViewProps as RNScrollViewProps,
  View as RNView,
} from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomSheetFooter } from "./BottomSheetFooter";
import { BottomSheetHeader } from "./BottomSheetHeader";
import { BottomSheetStyles } from "./styles";
import { TBottomSheetFooterProps, TBottomSheetHeaderProps } from "./types";

type TContentPropsWrap = PropsWithChildren<{
  header?: TBottomSheetHeaderProps;
  footer?: TBottomSheetFooterProps;
}>;

const _BottomSheetContent = forwardRef<
  RNScrollView,
  RNScrollViewProps & TContentPropsWrap
>(({ onContentSizeChange, header, footer, ...props }, ref) => {
  const viewRef = useRef(0);

  const [headerH, setHeaderH] = useState(0);
  const [footerH, setFooterH] = useState(0);
  const [contentH, setContentH] = useState(0);

  const { bottom: paddingBottom } = useSafeAreaInsets();
  const { enableDynamicSizing, animatedContentHeight } =
    useBottomSheetInternal();

  const onLayoutView = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    viewRef.current = nativeEvent.layout.height;
  }, []);

  useEffect(() => {
    if (enableDynamicSizing) {
      animatedContentHeight.set(viewRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (enableDynamicSizing && footerH && headerH) {
      animatedContentHeight.set(
        contentH +
          (header ? headerH : 0) +
          (footer ? footerH : 0) +
          paddingBottom +
          (header ? BottomSheetStyles.content.gap : 0) +
          (footer ? BottomSheetStyles.content.gap : 0),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [header, footer, contentH]);

  const handleContentSizeChange = (w: number, h: number) => {
    setContentH(h);
  };

  const onHeaderLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setHeaderH(layout.height);
  };

  const onFooterLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setFooterH(layout.height);
  };

  return (
    <RNView
      collapsable={false}
      style={[BottomSheetStyles.content, { paddingBottom }]}
      onLayout={onLayoutView}
    >
      {!!header && <BottomSheetHeader {...header} onLayout={onHeaderLayout} />}
      <RNScrollView
        ref={ref}
        {...props}
        onContentSizeChange={handleContentSizeChange}
      />
      {!!footer && <BottomSheetFooter {...footer} onLayout={onFooterLayout} />}
    </RNView>
  );
});

const AnimatedBottomSheetContent =
  Animated.createAnimatedComponent(_BottomSheetContent);

export const BottomSheetContent = createBottomSheetScrollableComponent<
  RNScrollView,
  ComponentProps<typeof AnimatedBottomSheetContent>
>(SCROLLABLE_TYPE.SCROLLVIEW, AnimatedBottomSheetContent);
