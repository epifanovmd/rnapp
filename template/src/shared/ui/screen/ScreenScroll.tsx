import { readAnimatedNumber, TAnimatedNumber } from "@shared/lib/animation";
import {
  usePullToRefreshHaptics,
  usePullToRefreshScroll,
} from "@shared/lib/pull-to-refresh";
import { IScrollTelemetry, useScrollTelemetry } from "@shared/lib/scroll";
import { useTheme } from "@shared/lib/theme";
import React, {
  FC,
  PropsWithChildren,
  ReactElement,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { StyleSheet, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeyboardAwareScrollView } from "../keyboard-aware-scroll-view";
import { RefreshIndicator } from "../refresh-indicator";

/** Сколько ждать `refreshing = true` после void-`onRefresh`, мс. */
const REFRESHING_GRACE_MS = 300;

export interface IScreenScrollProps {
  /**
   * Pull-to-refresh. Promise из onRefresh держит индикатор до завершения;
   * без Promise завершение — по переходу refreshing из true в false (если
   * refreshing не включился за REFRESHING_GRACE_MS — сразу).
   */
  refreshing?: boolean;
  onRefresh?: () => void | Promise<unknown>;
  /** Доп. отступ снизу (таб-бар); safe-area добавляется сам. */
  bottomInset?: number;
  /**
   * Отступ сверху (прозрачный навбар); он же отступ индикатора. Shared value
   * (`useNavbarInset()`) — контент следует за живой высотой панели без рывка.
   */
  topInset?: TAnimatedNumber;
  gap?: number;
  /** Телеметрия экрана (navbar, tab bar, HiddenBar): в неё пробрасываются события скролла. */
  telemetry?: IScrollTelemetry;
  /**
   * При закрытии клавиатуры вернуть скролл к положению на момент её открытия,
   * если пользователь не скроллил сам. По умолчанию `true`.
   */
  restoreScrollOnKeyboardHide?: boolean;
}

/** Прокручиваемый экран: отступы, клавиатура и pull-to-refresh. */
export const ScreenScroll: FC<PropsWithChildren<IScreenScrollProps>> = ({
  refreshing = false,
  onRefresh,
  bottomInset = 0,
  topInset = 0,
  gap = 12,
  telemetry: screenTelemetry,
  restoreScrollOnKeyboardHide = true,
  children,
}) => {
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();

  const finishRef = useRef<(() => void) | null>(null);
  const wasRefreshing = useRef(refreshing);

  useEffect(() => {
    if (refreshing) {
      wasRefreshing.current = true;
    } else if (wasRefreshing.current) {
      wasRefreshing.current = false;
      finishRef.current?.();
      finishRef.current = null;
    }
  }, [refreshing]);

  const handleRefresh = useCallback(() => {
    const result = onRefresh?.();

    if (result && typeof result.then === "function") {
      return result;
    }

    return new Promise<void>(resolve => {
      finishRef.current = resolve;
      // Экран не перевёл `refreshing` в true — ждать нечего, иначе индикатор
      // висел бы бесконечно.
      setTimeout(() => {
        if (!wasRefreshing.current && finishRef.current === resolve) {
          finishRef.current = null;
          resolve();
        }
      }, REFRESHING_GRACE_MS);
    });
  }, [onRefresh]);

  // Протяжку ведёт собственная телеметрия: общая телеметрия табов несёт
  // скролл соседних вкладок.
  const telemetry = useScrollTelemetry(screenTelemetry?.handlers);
  const handleStateChange = usePullToRefreshHaptics(true);

  const ptr = usePullToRefreshScroll({
    onRefresh: handleRefresh,
    enabled: !!onRefresh,
    telemetry,
    onStateChange: handleStateChange,
  });
  const { contentTranslateY } = ptr;

  const translateStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const insetStyle = useAnimatedStyle(() => ({
    height: readAnimatedNumber(topInset),
  }));

  const { gesture } = ptr;
  // GestureDetector протяжки — вплотную к ScrollView: цепляется к прямому ребёнку.
  const renderScrollView = useCallback(
    (scrollView: ReactElement) => (
      <GestureDetector gesture={gesture}>{scrollView}</GestureDetector>
    ),
    [gesture],
  );

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      {!!onRefresh && (
        <RefreshIndicator controller={ptr} topOffset={topInset} />
      )}

      <Animated.View style={[styles.fill, translateStyle]}>
        <KeyboardAwareScrollView
          topInset={topInset}
          restoreScrollOnKeyboardHide={restoreScrollOnKeyboardHide}
          renderScrollView={onRefresh ? renderScrollView : undefined}
          contentContainerStyle={styles.content}
          onScroll={telemetry.scrollHandler}
          bounces
          alwaysBounceVertical={!!onRefresh}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View pointerEvents={"none"} style={insetStyle} />
          <View
            style={[
              styles.body,
              { gap, paddingBottom: 16 + bottom + bottomInset },
            ]}
          >
            {children}
          </View>
        </KeyboardAwareScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  body: {
    paddingTop: 12,
  },
});
