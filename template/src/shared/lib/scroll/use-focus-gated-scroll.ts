import { NavigationContext } from "@react-navigation/native";
import { useContext, useEffect, useMemo } from "react";
import {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";

import { IScrollTelemetry, IScrollWorkletHandlers } from "./scroll.types";
import { useScroll } from "./use-scroll";

/**
 * Телеметрия экрана для вкладки, которая делит её с соседними (top-tabs под
 * общей шапкой): события скролла доходят до неё, только пока вкладка в
 * фокусе. Без этого инерция покинутой вкладки продолжала бы двигать общую
 * шапку после переключения.
 *
 * Флаги жеста и инерции на blur НЕ сбрасываются: сброс — это «конец жеста»,
 * навбар запускал бы доводку кадром позже `show()` на фокусе и прятал шапку.
 * Зависший флаг инерции покинутой вкладки снимает первый жест новой:
 * начало перетаскивания отменяет инерцию.
 *
 * Только для вкладок: одиночному экрану шлюз не нужен — там телеметрию
 * передают как есть.
 */
export const useFocusGatedScroll = (
  telemetry: IScrollTelemetry,
): IScrollTelemetry => {
  const navigation = useContext(NavigationContext);
  const focused = useSharedValue(navigation?.isFocused() ?? true);

  useEffect(() => {
    if (!navigation) return undefined;

    focused.value = navigation.isFocused();

    const offFocus = navigation.addListener("focus", () => {
      focused.value = true;
    });
    const offBlur = navigation.addListener("blur", () => {
      focused.value = false;
    });

    return () => {
      offFocus();
      offBlur();
    };
  }, [focused, navigation, telemetry]);

  const handlers = useMemo<IScrollWorkletHandlers>(() => {
    const target = telemetry.handlers;

    return {
      onScroll: event => {
        "worklet";
        if (focused.value) target.onScroll?.(event);
      },
      onBeginDrag: event => {
        "worklet";
        if (!focused.value) return;
        // Новый жест отменяет инерцию (в т.ч. оставшуюся от покинутой
        // вкладки): флаг снимается в один тик с isDragging — без доводки.
        telemetry.isMomentum.value = false;
        target.onBeginDrag?.(event);
      },
      onEndDrag: event => {
        "worklet";
        if (focused.value) target.onEndDrag?.(event);
      },
      onMomentumBegin: event => {
        "worklet";
        if (focused.value) target.onMomentumBegin?.(event);
      },
      onMomentumEnd: event => {
        "worklet";
        if (focused.value) target.onMomentumEnd?.(event);
      },
    };
  }, [focused, telemetry]);

  const scrollHandler = useAnimatedScrollHandler(handlers, [handlers]);

  return useMemo(
    () => ({ ...telemetry, handlers, scrollHandler }),
    [handlers, scrollHandler, telemetry],
  );
};

/** `useScroll()` для вкладки с общей шапкой: события — только из фокуса. */
export const useFocusedScroll = (): IScrollTelemetry =>
  useFocusGatedScroll(useScroll());
