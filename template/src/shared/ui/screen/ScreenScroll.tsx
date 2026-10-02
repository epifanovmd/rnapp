import { readAnimatedNumber, TAnimatedNumber } from "@shared/lib/animation";
import {
  KeyboardAwareContent,
  useKeyboardAwareScroll,
} from "@shared/lib/keyboard-aware";
import {
  usePullToRefreshHaptics,
  usePullToRefreshScroll,
} from "@shared/lib/pull-to-refresh";
import { IScrollTelemetry, useScrollTelemetry } from "@shared/lib/scroll";
import { useTheme } from "@shared/lib/theme";
import React, {
  FC,
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedRef,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RefreshIndicator } from "../refresh-indicator";
import { ScreenScrollView } from "./ScreenScrollView";

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
}

/** Прокручиваемый экран: отступы, клавиатура и pull-to-refresh. */
export const ScreenScroll: FC<PropsWithChildren<IScreenScrollProps>> = ({
  refreshing = false,
  onRefresh,
  bottomInset = 0,
  topInset = 0,
  gap = 12,
  telemetry: screenTelemetry,
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

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const keyboardAware = useKeyboardAwareScroll(scrollRef, { topInset });

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      {!!onRefresh && (
        <RefreshIndicator controller={ptr} topOffset={topInset} />
      )}

      <Animated.View style={[styles.fill, translateStyle]}>
        <ScreenScrollView
          ref={scrollRef}
          gesture={onRefresh ? ptr.gesture : null}
          contentContainerStyle={styles.content}
          onScroll={telemetry.scrollHandler}
          scrollEventThrottle={16}
          bounces
          alwaysBounceVertical={!!onRefresh}
          keyboardShouldPersistTaps={"handled"}
          showsVerticalScrollIndicator={false}
        >
          <KeyboardAwareContent controller={keyboardAware}>
            <Animated.View pointerEvents={"none"} style={insetStyle} />
            <View
              style={[
                styles.body,
                { gap, paddingBottom: 16 + bottom + bottomInset },
              ]}
            >
              {children}
            </View>
          </KeyboardAwareContent>
        </ScreenScrollView>
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
