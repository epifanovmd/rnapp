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

/**
 * Исчезновение строки: распад содержимого, следом схлопывание высоты.
 *
 * Фазы разнесены намеренно: распад лейаут не трогает — он живёт в оверлее провайдера и целиком на
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

/** Рождение частиц; схлопывание строки идёт следом, а не одновременно (мс). */
const BURST_MS = 150;
const COLLAPSE_MS = 180;

/** Мемоизация не нужна: строку уже мемоизирует `ChatRowView`. */
export const ChatRowCollapse: FC<PropsWithChildren<IChatRowCollapseProps>> = ({
  rowKey,
  removing,
  children,
}) => {
  const { disintegrate, available } = useDisintegrate();

  const contentRef = useRef<View>(null);

  /** 1 — обычная высота строки, 0 — свёрнутая. */
  const collapse = useSharedValue(1);
  const naturalHeight = useSharedValue(0);
  /** Содержимое гаснет мгновенно под частицами и плавно — без них. */
  const contentOpacity = useSharedValue(1);
  const removingRef = useRef(removing);
  /** Ключ строки, для которой распад уже запущен. */
  const startedFor = useRef<string | null>(null);

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

  useEffect(() => {
    if (!removing) {
      // Контейнер достался другой строке — состояние сбрасывается без анимации.
      startedFor.current = null;
      collapse.value = 1;
      contentOpacity.value = 1;

      return;
    }

    // Однократно на строку: повторный прогон эффекта на смене зависимостей
    // запустил бы второй распад того же сообщения.
    if (startedFor.current === rowKey) return;

    startedFor.current = rowKey;

    let cancelled = false;

    const startCollapse = () => {
      collapse.value = withDelay(
        BURST_MS,
        withTiming(0, {
          duration: COLLAPSE_MS,
          easing: Easing.inOut(Easing.quad),
        }),
      );
    };

    if (available) {
      // Всё после снимка — по его готовности. Прятать раньше нельзя: снимок
      // застанет уже скрытую строку. Схлопывать раньше — тоже: подготовка
      // занимает своё время, и строка начала бы съезжать до вылета частиц,
      // а замер под них пришёлся бы на уже уезжающую высоту.
      disintegrate(contentRef).then(burst => {
        if (cancelled) return;

        contentOpacity.value = burst
          ? 0
          : withTiming(0, { duration: BURST_MS + COLLAPSE_MS });
        startCollapse();
      });
    } else {
      contentOpacity.value = withTiming(0, {
        duration: BURST_MS + COLLAPSE_MS,
      });
      startCollapse();
    }

    return () => {
      cancelled = true;
    };
  }, [rowKey, removing, available, disintegrate, collapse, contentOpacity]);

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
