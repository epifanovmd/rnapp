import React, {
  FC,
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { useDisintegrate } from "../../disintegrate";
import { useChatViewContext } from "../model";

/**
 * Исчезновение строки: распад содержимого, следом схлопывание высоты.
 *
 * Фазы разнесены намеренно, и так же они разнесены в нативной реализации:
 * там удаление применяется к коллекции через `burstDuration` после запуска
 * эмиттера, а частицы летят дальше сами по себе поверх всего чата.
 *
 * Распад лейаут не трогает — он живёт в оверлее провайдера и целиком на
 * UI-потоке, список о нём не знает. Схлопывание лейаут меняет, и каждый его
 * кадр стоит списку одного `updateItemSize` с пересчётом позиций от этой
 * строки и ниже, поэтому занимает меньшую часть анимации.
 *
 * Схлопывание, а не одномоментное удаление с `itemLayoutAnimation`: список
 * держит позицию якоря (`maintainVisibleContentPosition`) и подкручивает
 * скролл на каждое изменение размера. Постепенное схлопывание он отрабатывает
 * покадрово и согласованно, а от анимации контейнеров вдогонку мгновенной
 * подкрутке скролла содержимое качнуло бы на высоту строки.
 */
interface IChatRowCollapseProps {
  /** Ключ строки: контейнеры переиспользуются, и состояние надо сбрасывать. */
  rowKey: string;
  /** Строка удалена из данных и доигрывает исчезновение. */
  removing: boolean;
}

/** Потолок высоты в покое: `maxHeight` не может быть «не задан». */
const UNCONSTRAINED_HEIGHT = 100000;

/** Мемоизация не нужна: строку уже мемоизирует `ChatRowView`. */
export const ChatRowCollapse: FC<PropsWithChildren<IChatRowCollapseProps>> = ({
  rowKey,
  removing,
  children,
}) => {
  const { layout, features } = useChatViewContext();
  const { disintegrate, available } = useDisintegrate();

  const contentRef = useRef<View>(null);

  /** 1 — обычная высота строки, 0 — свёрнутая. */
  const collapse = useSharedValue(1);
  const naturalHeight = useSharedValue(0);
  /** Содержимое гаснет мгновенно под частицами и плавно — без них. */
  const contentOpacity = useSharedValue(1);
  const removingRef = useRef(removing);

  removingRef.current = removing;

  // Высота нужна только к началу схлопывания, и мерить её после старта нельзя:
  // собственная анимация тут же затёрла бы измерение своим текущим значением.
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (!removingRef.current) {
        naturalHeight.value = event.nativeEvent.layout.height;
      }
    },
    [naturalHeight],
  );

  const withParticles = features.disintegrationEnabled && available;
  const burstMs = layout.messageBurstDelay * 1000;
  const collapseMs = layout.messageCollapseDuration * 1000;

  useEffect(() => {
    if (!removing) {
      // Контейнер достался другой строке — состояние сбрасывается без анимации.
      collapse.value = 1;
      contentOpacity.value = 1;

      return;
    }

    let cancelled = false;

    if (withParticles) {
      // Прятать содержимое только по готовности снимка: иначе он застанет
      // уже скрытую строку и рассыпать будет нечего.
      disintegrate(contentRef).then(started => {
        if (cancelled) return;

        contentOpacity.value = started
          ? 0
          : withTiming(0, { duration: burstMs + collapseMs });
      });
    } else {
      contentOpacity.value = withTiming(0, {
        duration: burstMs + collapseMs,
      });
    }

    collapse.value = withDelay(
      burstMs,
      withTiming(0, {
        duration: collapseMs,
        easing: Easing.inOut(Easing.quad),
      }),
    );

    return () => {
      cancelled = true;
    };
  }, [
    rowKey,
    removing,
    withParticles,
    disintegrate,
    collapse,
    contentOpacity,
    burstMs,
    collapseMs,
  ]);

  const rowStyle = useAnimatedStyle(() => {
    const value = collapse.value;

    // Пока строка не схлопывается, потолок снят: иначе он зафиксировал бы
    // высоту, и строка не выросла бы под догрузившееся вложение.
    return {
      maxHeight:
        value === 1 ? UNCONSTRAINED_HEIGHT : naturalHeight.value * value,
    };
  });

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  return (
    <Animated.View
      style={removing ? [ss.clipped, rowStyle] : rowStyle}
      onLayout={handleLayout}
    >
      {/* Отдельная вью под снимок: `collapsable` — чтобы Android её не схлопнул. */}
      <Animated.View ref={contentRef} style={contentStyle} collapsable={false}>
        {children}
      </Animated.View>
    </Animated.View>
  );
};

const ss = StyleSheet.create({
  // Только на время схлопывания: постоянное отсечение — лишний слой на каждую
  // строку. Частицы оно не задевает, они живут в оверлее провайдера.
  clipped: { overflow: "hidden" },
});
