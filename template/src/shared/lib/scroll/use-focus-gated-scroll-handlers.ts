import { NavigationContext } from "@react-navigation/native";
import { useContext, useEffect, useMemo } from "react";
import { useSharedValue } from "react-native-reanimated";

import { IScrollTelemetry, IScrollWorkletHandlers } from "./scroll.types";

/**
 * События скролла экрана — в общую телеметрию (навбар, HiddenBar, таб-бар),
 * только пока экран в фокусе. Вкладки делят одну телеметрию: инерция
 * покинутой вкладки иначе продолжала бы двигать общую шапку после
 * переключения, и `show()` на фокусе тут же отменялся. При потере фокуса
 * флаги жеста и инерции сбрасываются — их окончания уже не придут, а доводка
 * ждёт именно их. Вне навигатора экран считается сфокусированным.
 */
export const useFocusGatedScrollHandlers = (
  telemetry?: IScrollTelemetry,
): IScrollWorkletHandlers | undefined => {
  const navigation = useContext(NavigationContext);
  const focused = useSharedValue(navigation?.isFocused() ?? true);

  useEffect(() => {
    if (!navigation) return undefined;

    const offFocus = navigation.addListener("focus", () => {
      focused.value = true;
    });
    const offBlur = navigation.addListener("blur", () => {
      focused.value = false;

      if (telemetry) {
        telemetry.isDragging.value = false;
        telemetry.isMomentum.value = false;
      }
    });

    focused.value = navigation.isFocused();

    return () => {
      offFocus();
      offBlur();
    };
  }, [focused, navigation, telemetry]);

  return useMemo<IScrollWorkletHandlers | undefined>(() => {
    if (!telemetry) return undefined;

    const { handlers } = telemetry;

    return {
      onScroll: event => {
        "worklet";
        if (focused.value) handlers.onScroll?.(event);
      },
      onBeginDrag: event => {
        "worklet";
        if (focused.value) handlers.onBeginDrag?.(event);
      },
      onEndDrag: event => {
        "worklet";
        if (focused.value) handlers.onEndDrag?.(event);
      },
      onMomentumBegin: event => {
        "worklet";
        if (focused.value) handlers.onMomentumBegin?.(event);
      },
      onMomentumEnd: event => {
        "worklet";
        if (focused.value) handlers.onMomentumEnd?.(event);
      },
    };
  }, [focused, telemetry]);
};
