import type { IAnchorListProps } from "@epifanovmd/anchor-list";
import { IScrollTelemetry, useScrollTelemetry } from "@shared/lib/scroll";
import { createElement, ReactElement, useCallback, useMemo } from "react";
import { StyleSheet } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { IPullToRefreshConfig } from "./pull-to-refresh.types";
import { usePullToRefreshHaptics } from "./use-pull-to-refresh-haptics";
import { usePullToRefreshScroll } from "./use-pull-to-refresh-scroll";

export interface IAnchorListPullToRefreshConfig extends IPullToRefreshConfig {
  /**
   * Телеметрия экрана (navbar, tab bar, HiddenBar), куда пробрасываются
   * события списка. Протяжку ведёт собственная телеметрия списка: общая
   * телеметрия табов несёт скролл соседних вкладок.
   */
  telemetry?: IScrollTelemetry;
  /** Хаптика срабатывания (default true) */
  haptics?: boolean;
}

/** Пропсы AnchorList, которые подключают протяжку. */
export type TAnchorListPullToRefreshProps = Required<
  Pick<
    IAnchorListProps<unknown>,
    "bounces" | "scrollHandlers" | "renderScrollView"
  >
>;

/**
 * Pull-to-refresh для AnchorList: связка usePullToRefreshScroll со списком.
 *
 * iOS — протяжка с native bounce, Android — pan-жест одновременно с нативным
 * жестом ScrollView; контент на Android сдвигается за протяжкой внутри
 * обёртки ScrollView. Подключение:
 *
 * const ptr = useAnchorListPullToRefresh({ onRefresh, telemetry });
 * <RefreshIndicator controller={ptr} topOffset={navbarHeight} />
 * <AnchorList {...ptr.listProps} ... />
 */
export const useAnchorListPullToRefresh = ({
  telemetry: screenTelemetry,
  haptics = true,
  onStateChange,
  ...config
}: IAnchorListPullToRefreshConfig) => {
  const telemetry = useScrollTelemetry(screenTelemetry?.handlers);

  const handleStateChange = usePullToRefreshHaptics(haptics, onStateChange);

  const ptr = usePullToRefreshScroll({
    ...config,
    telemetry,
    onStateChange: handleStateChange,
  });
  const { gesture, contentTranslateY } = ptr;

  const translateStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const renderScrollView = useCallback(
    (scrollView: ReactElement) =>
      createElement(
        Animated.View,
        { style: [styles.fill, translateStyle] },
        createElement(GestureDetector, { gesture }, scrollView),
      ),
    [gesture, translateStyle],
  );

  const listProps = useMemo<TAnchorListPullToRefreshProps>(
    () => ({
      bounces: true,
      scrollHandlers: telemetry.handlers,
      renderScrollView,
    }),
    [renderScrollView, telemetry.handlers],
  );

  return useMemo(
    () => ({ ...ptr, telemetry, listProps }),
    [listProps, ptr, telemetry],
  );
};

export type TAnchorListPullToRefresh = ReturnType<
  typeof useAnchorListPullToRefresh
>;

const styles = StyleSheet.create({ fill: { flex: 1 } });
