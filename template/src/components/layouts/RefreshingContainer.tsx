import "react-native-gesture-handler";

import { mergeRefs } from "@force-dev/react-mobile";
import React, {
  forwardRef,
  memo,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ColorValue,
  FlatList,
  FlatListProps,
  PanResponder,
  Platform,
  SafeAreaView,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  View,
  ViewProps,
} from "react-native";
import { NativeScrollEvent } from "react-native/Libraries/Components/ScrollView/ScrollView";
import { NativeSyntheticEvent } from "react-native/Libraries/Types/CoreEventTypes";
import { trigger } from "react-native-haptic-feedback";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { AnimatedRefreshing } from "../animatedRefreshing";

export interface RefreshingContainerProps extends PropsWithChildren {
  delay?: number;
  maxDistance?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
  duration?: number;
  refreshDuration?: number;
  activeRefreshBackground?: ColorValue;
  onScroll?:
    | ((event: NativeSyntheticEvent<NativeScrollEvent>) => void)
    | undefined;
}

interface RefreshingContainer {
  FlatList: <T>(
    props: RefreshingContainerProps &
      FlatListProps<T> & { ref?: React.RefObject<Animated.FlatList<T>> },
  ) => React.JSX.Element | null;
  ScrollView: (
    props: RefreshingContainerProps &
      ScrollViewProps & { ref?: React.RefObject<Animated.ScrollView> },
  ) => React.JSX.Element | null;
  View: (
    props: Omit<RefreshingContainerProps, "onScroll"> &
      ViewProps & { ref?: React.RefObject<Animated.View> },
  ) => React.JSX.Element | null;

  /**
   * @deprecated Please use `RefreshingContainer.View or RefreshingContainer.ScrollView or RefreshingContainer.FlatList` manually.
   */
  (props: RefreshingContainerProps): React.JSX.Element | null;
}

const _RefreshingContainer = Animated.createAnimatedComponent(
  memo(
    forwardRef<any, RefreshingContainerProps>(
      (
        {
          delay = 350,
          maxDistance = 100,
          refreshing = false,
          onRefresh,
          duration = 300,
          refreshDuration = 300,
          activeRefreshBackground = "#fff",
          onScroll,
          children,
        },
        ref,
      ) => {
        const scrollRef = useRef<View | ScrollView | FlatList>(null);
        const refreshingRef = useRef(false);
        const isRefreshingRef = useRef(false);
        const timeoutRef = useRef<any>(null);

        const isScrolled = useSharedValue(false);
        const percentage = useSharedValue(0);
        const refreshPosition = useSharedValue(0);
        const height = useSharedValue(0);
        const isRefreshing = useSharedValue(false);

        const [enabledPan, setEnabledPan] = useState(true);
        const [isScrollable, setIsScrollable] = useState(false);

        useEffect(() => {
          const _isScrollable = !!(
            (scrollRef.current as ScrollView)?.scrollTo ||
            (scrollRef.current as FlatList)?.scrollToOffset
          );

          setEnabledPan(
            !!onRefresh && (Platform.OS === "android" || !_isScrollable),
          );
          setIsScrollable(_isScrollable);
        }, [onRefresh]);

        const onComplete = useCallback(() => {
          refreshingRef.current = false;

          height.value = refreshPosition.value = withTiming(0, { duration });
          scrollRef.current?.setNativeProps({ scrollEnabled: true });

          setTimeout(() => {
            isRefreshing.value = false;
            isRefreshingRef.current = false;
            percentage.value = 0;
          }, duration);
        }, [duration, height, isRefreshing, percentage, refreshPosition]);

        const startRefresh = useCallback(() => {
          isRefreshing.value = true;
          isRefreshingRef.current = true;

          percentage.value = withTiming(100, { duration });
          refreshPosition.value = withTiming(maxDistance, { duration }, () => {
            percentage.value = withRepeat(
              withTiming(500, { duration: refreshDuration * 5 }),
              -1,
            );
          });
        }, [
          duration,
          isRefreshing,
          maxDistance,
          percentage,
          refreshDuration,
          refreshPosition,
        ]);

        const onPanRelease = useCallback(() => {
          height.value = withTiming(0, {
            duration,
          });

          if (!refreshingRef.current) {
            refreshPosition.value = withTiming(0, {
              duration,
            });
            percentage.value = withTiming(0, {
              duration,
            });
          }
        }, [duration, height, percentage, refreshPosition]);

        const onMove = useCallback(
          (dy: number, withoutHeight = false) => {
            const _dy = dy > 0 ? dy : 0;
            const position = Math.min(maxDistance, _dy);

            if (!isRefreshingRef.current) {
              if (!withoutHeight) {
                height.value = refreshPosition.value = position;
              } else {
                refreshPosition.value = position;
              }
              percentage.value = Math.min(100, _dy * (100 / maxDistance));
            }

            if (position >= maxDistance && !isRefreshingRef.current) {
              isRefreshing.value = true;
              isRefreshingRef.current = true;

              height.value = withTiming(0, {
                duration,
              });
              percentage.value = withRepeat(
                withTiming(300, { duration: refreshDuration * 3 }),
                -1,
              );

              (scrollRef.current as FlatList)?.scrollToOffset?.({ offset: 0 });
              (scrollRef.current as ScrollView)?.scrollTo?.({ y: 0 });
              scrollRef.current?.setNativeProps({ scrollEnabled: false });

              timeoutRef.current = setTimeout(() => {
                onComplete();
              }, 100);

              trigger("impactMedium");
              onRefresh?.();
            }
          },
          [
            duration,
            height,
            isRefreshing,
            maxDistance,
            onComplete,
            onRefresh,
            percentage,
            refreshDuration,
            refreshPosition,
          ],
        );

        const scrollHandler = useAnimatedScrollHandler(
          {
            onScroll: event => {
              if (enabledPan) {
                isScrolled.value = event.contentOffset.y > 1;
              } else if (isScrollable) {
                runOnJS(onMove)(-1 * event.contentOffset.y, true);
              }
            },
          },
          [enabledPan, isScrollable],
        );

        const panResponder = useMemo(() => {
          return PanResponder.create({
            onMoveShouldSetPanResponder: (event, gestureState) => {
              return (
                !isScrolled.value &&
                gestureState.dy >= 0 &&
                gestureState.dy <= maxDistance &&
                !isRefreshingRef.current &&
                !refreshingRef.current
              );
            },
            onPanResponderMove: (event, gestureState) => {
              onMove(gestureState.dy);
            },
            onPanResponderRelease: onPanRelease,
            onPanResponderTerminate: onPanRelease,
          });
        }, [isScrolled.value, maxDistance, onMove, onPanRelease]);

        useEffect(() => {
          if (refreshing) {
            refreshingRef.current = true;
            timeoutRef.current && clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
              startRefresh();
            }, delay);
          } else {
            timeoutRef.current && clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
            if (isRefreshingRef.current || refreshingRef.current) {
              onComplete();
            }
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [refreshing]);

        const childrenStyle = useAnimatedStyle(() => {
          return {
            transform: [
              {
                translateY: height.value,
              },
            ],
          };
        });

        const refreshContainerStyle = useAnimatedStyle(() => {
          return {
            height: height.value,
          };
        });

        const activeRefreshStyle = useAnimatedStyle(() => {
          const scale = Math.min(1, Math.max(0, refreshPosition.value / 100));

          return {
            backgroundColor: isRefreshing.value
              ? activeRefreshBackground
              : "transparent",
            opacity: scale,
            transform: [
              {
                translateY: refreshPosition.value - 40,
              },
            ],
          };
        }, [activeRefreshBackground]);

        return (
          <SafeAreaView style={styles.root}>
            <View style={styles.root}>
              <View
                pointerEvents={"none"}
                style={[
                  styles.refreshRoot,
                  {
                    height: maxDistance,
                  },
                ]}
              >
                <Animated.View
                  style={[styles.refreshContainer, refreshContainerStyle]}
                >
                  <Animated.View
                    style={[styles.refreshIconWrap, activeRefreshStyle]}
                  >
                    <AnimatedRefreshing percentage={percentage} />
                  </Animated.View>
                </Animated.View>
              </View>

              <Animated.View
                style={[styles.root, childrenStyle]}
                {...(onRefresh && enabledPan && !refreshing
                  ? panResponder.panHandlers
                  : {})}
              >
                {children &&
                  React.cloneElement(children as any, {
                    ref: mergeRefs([ref, scrollRef]),
                    onScroll: scrollHandler,
                    nativeOnScroll: onScroll,
                    scrollEventThrottle: 16,
                  })}
              </Animated.View>
            </View>
          </SafeAreaView>
        );
      },
    ),
  ),
);

export const RefreshingContainer: RefreshingContainer = () => {
  useEffect(() => {
    throw new Error(
      "@deprecated Please use `RefreshingContainer.View or RefreshingContainer.ScrollView or RefreshingContainer.FlatList` manually",
    );
  }, []);

  return <View />;
};

RefreshingContainer.FlatList = memo(
  forwardRef<
    Animated.FlatList<any>,
    RefreshingContainerProps & FlatListProps<any>
  >(
    (
      {
        maxDistance,
        refreshing,
        onRefresh,
        duration,
        refreshDuration,
        onScroll,
        children,
        bounces = true,
        ...rest
      },
      ref,
    ) => {
      return (
        <_RefreshingContainer
          maxDistance={maxDistance}
          refreshing={refreshing}
          onRefresh={onRefresh}
          duration={duration}
          refreshDuration={refreshDuration}
          onScroll={onScroll}
        >
          <AnimatedFlatList ref={ref} bounces={bounces} {...rest}>
            {children}
          </AnimatedFlatList>
        </_RefreshingContainer>
      );
    },
  ),
);

RefreshingContainer.ScrollView = memo(
  forwardRef<Animated.ScrollView, RefreshingContainerProps & ScrollViewProps>(
    (
      {
        maxDistance,
        refreshing,
        onRefresh,
        duration,
        refreshDuration,
        onScroll,
        children,
        bounces = true,
        ...rest
      },
      ref,
    ) => {
      return (
        <_RefreshingContainer
          maxDistance={maxDistance}
          refreshing={refreshing}
          onRefresh={onRefresh}
          duration={duration}
          refreshDuration={refreshDuration}
          onScroll={onScroll}
        >
          <AnimatedScrollView ref={ref} bounces={bounces} {...rest}>
            {children}
          </AnimatedScrollView>
        </_RefreshingContainer>
      );
    },
  ),
);

RefreshingContainer.View = memo(
  forwardRef<Animated.View, RefreshingContainerProps & ViewProps>(
    (
      {
        maxDistance,
        refreshing,
        onRefresh,
        duration,
        refreshDuration,
        onScroll,
        children,
        ...rest
      },
      ref,
    ) => {
      return (
        <_RefreshingContainer
          maxDistance={maxDistance}
          refreshing={refreshing}
          onRefresh={onRefresh}
          duration={duration}
          refreshDuration={refreshDuration}
          onScroll={onScroll}
        >
          <Animated.View ref={ref} {...rest}>
            {children}
          </Animated.View>
        </_RefreshingContainer>
      );
    },
  ),
);

const AnimatedScrollView = Animated.createAnimatedComponent(
  forwardRef<Animated.ScrollView, ScrollViewProps>(
    ({ children, ...rest }, ref) => {
      return (
        <Animated.ScrollView
          ref={ref}
          {...rest}
          onScroll={rest.onScroll ?? (rest as any).nativeOnScroll}
        >
          {children}
        </Animated.ScrollView>
      );
    },
  ),
);

const AnimatedFlatList = Animated.createAnimatedComponent(
  forwardRef<FlatList, FlatListProps<any>>(({ children, ...rest }, ref) => {
    return (
      <Animated.FlatList
        ref={ref}
        {...rest}
        onScroll={(rest as any).nativeOnScroll ?? rest.onScroll}
      >
        {children}
      </Animated.FlatList>
    );
  }),
);

const styles = StyleSheet.create({
  container: {
    marginTop: 100,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  spinner: {
    height: 60,
    width: 60,
    borderRadius: 30,
    borderWidth: 7,
    borderTopColor: "#f5f5f5",
    borderRightColor: "#f5f5f5",
    borderBottomColor: "#f5f5f5",
    borderLeftColor: "green",
  },

  root: {
    flex: 1,
  },
  refreshRoot: {
    zIndex: Number.MAX_SAFE_INTEGER,
    overflow: "hidden",
    position: "absolute",
    left: 0,
    right: 0,
  },
  refreshContainer: {
    overflow: "visible",
    position: "absolute",
    left: 0,
    right: 0,

    marginHorizontal: "auto",
    flexDirection: "row",
    justifyContent: "center",
  },
  refreshIconWrap: {
    position: "absolute",
    padding: 3,
    borderRadius: 100,
  },
  refreshIcon: {
    height: 32,
    width: 32,
  },
});
