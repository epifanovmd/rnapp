import React, {
  forwardRef,
  memo,
  PropsWithChildren,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { LayoutChangeEvent, StyleSheet, ViewProps } from "react-native";
import Animated, {
  Easing,
  EasingFunction,
  EasingFunctionFactory,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

export interface ICollapsableProps extends ViewProps {
  /** Свёрнутое состояние (semi-controlled: проп синхронизируется, ref.toggle работает поверх). */
  collapsed?: boolean;
  /** Высота свёрнутого превью: контент виден обрезанным сверху. */
  collapsedHeight?: number;
  duration?: number;
  easing?: EasingFunction | EasingFunctionFactory;
  /**
   * Фейд контента при сворачивании. Применяется только при полном сворачивании
   * или кросс-фейде с collapsedContent — обрезанное превью остаётся видимым.
   */
  opacityAnimation?: boolean;
  /** Контент свёрнутого состояния; его высота становится высотой превью (кросс-фейд). */
  collapsedContent?: React.ReactNode;
  onAnimationEnd?: (collapsed: boolean) => void;
}

export interface ICollapsableRef {
  /** Переключить состояние; без аргумента — инвертировать. */
  toggle: (collapsed?: boolean) => void;
  readonly collapsed: boolean;
}

const DEFAULT_EASING = Easing.inOut(Easing.ease);

/**
 * Разворачиваемый блок на Reanimated: высота и прозрачность анимируются на
 * UI-потоке. Контент измеряется в absolute-обёртке — вне высотного констрейнта
 * контейнера, поэтому измерение всегда даёт полную высоту, а динамический
 * контент (подгрузка, смена текста) подхватывается автоматически. До первого
 * измерения развёрнутый блок рендерится в потоке (без кадра-вспышки).
 */
export const Collapsable = memo(
  forwardRef<ICollapsableRef, PropsWithChildren<ICollapsableProps>>(
    (
      {
        collapsed: collapsedProp = false,
        collapsedHeight = 0,
        duration = 200,
        easing = DEFAULT_EASING,
        opacityAnimation = true,
        collapsedContent,
        onAnimationEnd,
        children,
        style,
        ...rest
      },
      ref,
    ) => {
      const [collapsed, setCollapsed] = useState(collapsedProp);
      const [measured, setMeasured] = useState(false);
      const initialCollapsed = useRef(collapsedProp).current;

      /** 0 — свёрнуто, 1 — развёрнуто. */
      const progress = useSharedValue(collapsedProp ? 0 : 1);
      const contentHeight = useSharedValue(0);
      const previewHeight = useSharedValue(collapsedHeight);

      /**
       * Контент absolute (измерение без констрейнта высоты контейнера) везде,
       * кроме первого рендера развёрнутого блока — там он в потоке, чтобы
       * контейнер сразу взял auto-высоту. После измерения пиксельно идентичен.
       */
      const contentAbsolute = measured || initialCollapsed;

      /** Контент скрывается только когда его не видно в свёрнутом состоянии. */
      const fadeContent =
        opacityAnimation && (!!collapsedContent || collapsedHeight === 0);

      useEffect(() => {
        setCollapsed(collapsedProp);
      }, [collapsedProp]);

      useEffect(() => {
        const emitEnd = (value: boolean) => onAnimationEnd?.(value);

        progress.value = withTiming(
          collapsed ? 0 : 1,
          { duration, easing },
          finished => {
            if (finished) {
              scheduleOnRN(emitEnd, collapsed);
            }
          },
        );
      }, [collapsed, duration, easing, onAnimationEnd, progress]);

      useEffect(() => {
        if (!collapsedContent) {
          previewHeight.value = collapsedHeight;
        }
      }, [collapsedHeight, collapsedContent, previewHeight]);

      useImperativeHandle(
        ref,
        () => ({
          toggle: value => setCollapsed(current => value ?? !current),
          get collapsed() {
            return collapsed;
          },
        }),
        [collapsed],
      );

      const handleContentLayout = useCallback(
        (event: LayoutChangeEvent) => {
          contentHeight.value = event.nativeEvent.layout.height;
          setMeasured(true);
        },
        [contentHeight],
      );

      const handlePreviewLayout = useCallback(
        (event: LayoutChangeEvent) => {
          previewHeight.value = event.nativeEvent.layout.height;
        },
        [previewHeight],
      );

      const containerStyle = useAnimatedStyle(() => ({
        height: interpolate(
          progress.value,
          [0, 1],
          [previewHeight.value, contentHeight.value],
        ),
      }));

      const contentStyle = useAnimatedStyle(() => ({
        opacity: fadeContent
          ? interpolate(progress.value, [0, 0.5, 1], [0, 0, 1])
          : 1,
      }));

      const previewStyle = useAnimatedStyle(() => ({
        opacity: interpolate(progress.value, [0, 0.5, 1], [1, 0, 0]),
      }));

      return (
        <Animated.View
          accessibilityState={{ expanded: !collapsed }}
          style={[
            styles.container,
            style,
            contentAbsolute ? containerStyle : undefined,
          ]}
          {...rest}
        >
          <Animated.View
            style={[contentAbsolute && styles.absolute, contentStyle]}
            pointerEvents={collapsed ? "none" : "auto"}
            onLayout={handleContentLayout}
          >
            {children}
          </Animated.View>
          {!!collapsedContent && (
            <Animated.View
              style={[styles.absolute, previewStyle]}
              pointerEvents={collapsed ? "auto" : "none"}
              onLayout={handlePreviewLayout}
            >
              {collapsedContent}
            </Animated.View>
          )}
        </Animated.View>
      );
    },
  ),
);

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  absolute: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
});
