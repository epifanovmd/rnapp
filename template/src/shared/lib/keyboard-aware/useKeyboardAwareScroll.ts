import { readAnimatedNumber, TAnimatedNumber } from "@shared/lib/animation";
import { useEffect, useMemo } from "react";
import { ViewStyle } from "react-native";
import {
  useKeyboardHandler,
  useReanimatedFocusedInput,
  useWindowDimensions,
} from "react-native-keyboard-controller";
import Animated, {
  AnimatedRef,
  AnimatedStyle,
  measure,
  MeasuredDimensions,
  ScrollEvent,
  scrollTo,
  SharedValue,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useEvent,
  useSharedValue,
} from "react-native-reanimated";

import { IKeyboardAwareFieldRegistry } from "./keyboard-aware-context";
import {
  computeKeyboardAwareOffset,
  computeMaxScrollOffset,
  interpolateScrollOffset,
  keyboardOverlap,
  keyboardProgress,
} from "./keyboard-aware-offset";

export interface IKeyboardAwareScrollOptions {
  /** Зазор между низом поля и клавиатурой, px. По умолчанию 16. */
  bottomOffset?: number;
  /** Выключить докрутку и распорку. По умолчанию `true`. */
  enabled?: boolean;
  /** Перекрытие верха скролла (прозрачный навбар): поле не уводится под него. */
  topInset?: TAnimatedNumber;
  /**
   * Распорка высотой с перекрытие клавиатурой в конце контента — чтобы
   * нижние поля могли подняться. В шторке выключается: gorhom сам ужимает
   * шторку над клавиатурой. По умолчанию `true`.
   */
  spacer?: boolean;
  /**
   * Позиция контейнера скролла (`animatedPosition` шторки gorhom). Подъём
   * контейнера при открытой клавиатуре вызывает пересчёт по реальной геометрии.
   */
  containerPosition?: SharedValue<number>;
}

export interface IKeyboardAwareScroll {
  /** Реестр полей — в `KeyboardAwareContext` (его ставит `KeyboardAwareContent`). */
  registry: IKeyboardAwareFieldRegistry;
  /** Ref распорки — последнего элемента контента. */
  spacerRef: AnimatedRef<Animated.View>;
  spacerStyle: AnimatedStyle<ViewStyle>;
  /** Текущая высота распорки. */
  spacerHeight: SharedValue<number>;
}

type TFieldRefs = Record<number, AnimatedRef<Animated.View> | undefined>;

interface IEventRegistration {
  workletEventHandler: {
    registerForEvents: (tag: number) => void;
    unregisterFromEvents: (tag: number) => void;
  };
}

const NO_TARGET = -1;
const MAX_OFFSET_UNKNOWN = Number.MAX_SAFE_INTEGER;

const SCROLL_EVENTS = [
  "onScroll",
  "onScrollBeginDrag",
  "onScrollEndDrag",
  "onMomentumScrollBegin",
  "onMomentumScrollEnd",
];

/**
 * Поле ввода над клавиатурой в скролле — на примитивах keyboard-controller.
 *
 * Поле берётся целиком: поля кита регистрируют контейнер в реестре
 * (`useKeyboardAwareField`), прямоугольник меряется на UI-потоке; иначе —
 * layout сфокусированного ввода (`useReanimatedFocusedInput`), если ввод
 * лежит в этом скролле. Докрутка идёт покадрово вместе с клавиатурой: от
 * начального смещения к целевому по её прогрессу. Пересчёт — при смене поля
 * при открытой клавиатуре, росте поля (ошибка, multiline) и подъёме
 * контейнера (`containerPosition`). Пока палец на скролле — не вмешивается.
 *
 * Подключение к `Animated.ScrollView` (ref обязан быть animated ref):
 * ```tsx
 * const scrollRef = useAnimatedRef<Animated.ScrollView>();
 * const keyboardAware = useKeyboardAwareScroll(scrollRef, { topInset });
 *
 * <Animated.ScrollView ref={scrollRef}>
 *   <KeyboardAwareContent controller={keyboardAware}>{fields}</KeyboardAwareContent>
 * </Animated.ScrollView>
 * ```
 * `KeyboardAwareContent` — реестр полей и распорка последним элементом.
 * Нижний отступ контента — внутри детей: после распорки отступов быть не должно.
 *
 * AnchorList — ref через `refScrollView` (у link-пакета своя копия типов
 * reanimated — нужен каст), распорка — последней в футере, реестр — снаружи:
 * ```tsx
 * <KeyboardAwareContext.Provider value={keyboardAware.registry}>
 *   <AnchorList
 *     refScrollView={scrollRef as unknown as IAnchorListProps<unknown>["refScrollView"]}
 *     ListFooterComponent={<KeyboardAwareSpacer controller={keyboardAware} />}
 *     ...
 *   />
 * </KeyboardAwareContext.Provider>
 * ```
 * `insetEnd` вместе с хуком не передавать: он сам поднимает смещение на
 * клавиатуру и спорил бы с докруткой к полю. `scrollHandlers` не нужны —
 * смещение и жест хук слушает сам по ref.
 */
export const useKeyboardAwareScroll = (
  scrollRef: AnimatedRef<Animated.ScrollView>,
  {
    bottomOffset = 16,
    enabled = true,
    topInset = 0,
    spacer = true,
    containerPosition,
  }: IKeyboardAwareScrollOptions = {},
): IKeyboardAwareScroll => {
  const { height: screenHeight } = useWindowDimensions();
  const { input } = useReanimatedFocusedInput();

  const fields = useSharedValue<TFieldRefs>({});
  const layoutVersion = useSharedValue(0);
  const spacerRef = useAnimatedRef<Animated.View>();
  const spacerHeight = useSharedValue(0);

  const scrollTag = useSharedValue(NO_TARGET);
  const offset = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const keyboardHeight = useSharedValue(0);
  const keyboardFrom = useSharedValue(0);
  const keyboardTo = useSharedValue(0);
  const isAnimating = useSharedValue(false);

  // Поле и распорка — в координатах контента (не зависят от смещения).
  const target = useSharedValue(NO_TARGET);
  const hasField = useSharedValue(false);
  const fieldTop = useSharedValue(0);
  const fieldBottom = useSharedValue(0);
  const spacerTop = useSharedValue(-1);
  const startOffset = useSharedValue(0);

  const scrollEvents = useEvent<ScrollEvent>(event => {
    "worklet";
    offset.value = event.contentOffset.y;

    if (
      event.eventName.endsWith("onScrollBeginDrag") ||
      event.eventName.endsWith("onMomentumScrollBegin")
    ) {
      isDragging.value = true;
    } else if (
      event.eventName.endsWith("onScrollEndDrag") ||
      event.eventName.endsWith("onMomentumScrollEnd")
    ) {
      isDragging.value = false;
    }
  }, SCROLL_EVENTS) as unknown as IEventRegistration;

  useEffect(() => {
    // observe возвращает отписку, хотя тип говорит void.
    const cleanup = scrollRef.observe(tag => {
      scrollTag.value = tag ?? NO_TARGET;

      if (!tag) return;

      scrollEvents.workletEventHandler.registerForEvents(tag);

      return () => scrollEvents.workletEventHandler.unregisterFromEvents(tag);
    }) as unknown as (() => void) | undefined;

    return cleanup;
  }, [scrollRef, scrollEvents, scrollTag]);

  const setOffset = (y: number, animated: boolean) => {
    "worklet";
    offset.value = y;
    scrollTo(scrollRef, 0, y, animated);
  };

  /** Верх распорки в координатах контента. */
  const captureSpacer = (viewport: MeasuredDimensions) => {
    "worklet";
    const box = measure(spacerRef);

    spacerTop.value = box ? box.pageY - viewport.pageY + offset.value : -1;
  };

  /** Замер поля в координатах контента; false — поле не из этого скролла. */
  const captureField = (tag: number) => {
    "worklet";
    hasField.value = false;

    if (tag === NO_TARGET) return false;

    const viewport = measure(scrollRef);

    if (!viewport) return false;

    const origin = viewport.pageY - offset.value;
    const containerRef = fields.value[tag];
    const box = containerRef ? measure(containerRef) : null;

    if (box) {
      fieldTop.value = box.pageY - origin;
      fieldBottom.value = box.pageY + box.height - origin;
    } else {
      const focused = input.value;

      if (
        !focused ||
        focused.target !== tag ||
        focused.parentScrollViewTarget !== scrollTag.value
      ) {
        return false;
      }

      fieldTop.value = focused.layout.absoluteY - origin;
      fieldBottom.value =
        focused.layout.absoluteY + focused.layout.height - origin;
    }

    captureSpacer(viewport);
    target.value = tag;
    hasField.value = true;
    startOffset.value = offset.value;

    return true;
  };

  const spacerFor = (viewport: MeasuredDimensions, keyboard: number) => {
    "worklet";

    return spacer
      ? keyboardOverlap(
          viewport.pageY + viewport.height,
          screenHeight,
          keyboard,
        )
      : 0;
  };

  /** Целевое смещение по текущей геометрии скролла и высоте клавиатуры. */
  const computeGoal = (viewport: MeasuredDimensions, keyboard: number) => {
    "worklet";
    const reference = startOffset.value;
    const origin = viewport.pageY - reference;
    const maxOffset =
      spacerTop.value >= 0
        ? computeMaxScrollOffset(
            spacerTop.value,
            Math.max(spacerFor(viewport, keyboard), spacerHeight.value),
            viewport.height,
          )
        : MAX_OFFSET_UNKNOWN;

    return computeKeyboardAwareOffset({
      fieldTop: origin + fieldTop.value,
      fieldBottom: origin + fieldBottom.value,
      visibleTop: viewport.pageY + readAnimatedNumber(topInset),
      viewportBottom: viewport.pageY + viewport.height,
      screenHeight,
      keyboardHeight: keyboard,
      bottomOffset,
      currentOffset: reference,
      maxOffset,
    });
  };

  /** Новая высота распорки; при уменьшении смещение не выходит за контент. */
  const resizeSpacer = (viewport: MeasuredDimensions, next: number) => {
    "worklet";

    if (next < spacerHeight.value && spacerTop.value >= 0) {
      const maxOffset = computeMaxScrollOffset(
        spacerTop.value,
        next,
        viewport.height,
      );

      if (offset.value > maxOffset && !isDragging.value) {
        setOffset(maxOffset, false);
      }
    }

    spacerHeight.value = next;
  };

  const ensureVisible = (recapture: boolean, animated: boolean) => {
    "worklet";

    if (!enabled || isAnimating.value || isDragging.value) return;
    if (keyboardHeight.value <= 0 || !hasField.value) return;
    if (recapture && !captureField(target.value)) return;

    const viewport = measure(scrollRef);

    if (!viewport) return;

    const goal = computeGoal(viewport, keyboardHeight.value);

    if (Math.abs(goal - offset.value) > 0.5) setOffset(goal, animated);
  };

  useKeyboardHandler(
    {
      onStart: event => {
        "worklet";
        const from = keyboardHeight.value;

        keyboardFrom.value = from;
        keyboardTo.value = event.height;

        if (!enabled) return;

        const viewport = measure(scrollRef);

        if (!viewport) return;

        if (event.height <= 0) {
          hasField.value = false;
          isAnimating.value = true;
          captureSpacer(viewport);

          return;
        }

        if (!captureField(event.target)) {
          isAnimating.value = false;

          return;
        }

        // Распорка резервируется сразу: layout отстаёт на кадр, иначе
        // scrollTo у самого низа упрётся в ещё не выросший контент.
        spacerHeight.value = Math.max(
          spacerHeight.value,
          spacerFor(viewport, event.height),
        );

        // Смена поля без изменения высоты: кадров анимации не будет.
        if (Math.abs(event.height - from) < 1) {
          isAnimating.value = false;
          keyboardHeight.value = event.height;
          ensureVisible(false, true);

          return;
        }

        isAnimating.value = true;
      },
      onMove: event => {
        "worklet";
        keyboardHeight.value = event.height;

        if (!enabled || !isAnimating.value || isDragging.value) return;

        const hiding = keyboardTo.value <= 0;

        if (hiding ? spacerHeight.value <= 0 : !hasField.value) return;

        const viewport = measure(scrollRef);

        if (!viewport) return;

        if (hiding) {
          resizeSpacer(viewport, spacerFor(viewport, event.height));

          return;
        }

        // Цель пересчитывается каждый кадр: контейнер (шторка) может ехать
        // одновременно с клавиатурой.
        const goal = computeGoal(viewport, keyboardTo.value);
        const progress = keyboardProgress(
          event.height,
          keyboardFrom.value,
          keyboardTo.value,
        );

        setOffset(
          interpolateScrollOffset(startOffset.value, goal, progress),
          false,
        );
      },
      onInteractive: event => {
        "worklet";
        keyboardHeight.value = event.height;
      },
      onEnd: event => {
        "worklet";
        const wasAnimating = isAnimating.value;

        keyboardHeight.value = event.height;
        keyboardTo.value = event.height;
        isAnimating.value = false;

        if (!enabled) return;

        const viewport = measure(scrollRef);

        if (!viewport) return;

        if (event.height <= 0) {
          hasField.value = false;
          resizeSpacer(viewport, 0);

          return;
        }

        if (!hasField.value) return;

        resizeSpacer(viewport, spacerFor(viewport, event.height));

        if (!wasAnimating || isDragging.value) return;

        // Доводка: платформы без покадровых событий и сдвиг контейнера.
        const goal = computeGoal(viewport, event.height);
        const distance = Math.abs(goal - offset.value);

        if (distance > 0.5) setOffset(goal, distance > 2);
      },
    },
    [enabled, spacer, bottomOffset, screenHeight, topInset],
  );

  useAnimatedReaction(
    () => layoutVersion.value,
    (version, previous) => {
      if (previous !== null && version !== previous) ensureVisible(true, true);
    },
  );

  // Рост незарегистрированного поля (multiline) — по layout от keyboard-controller.
  useAnimatedReaction(
    () => input.value?.layout.height ?? 0,
    (height, previous) => {
      if (previous === null || Math.abs(height - previous) < 0.5) return;
      if (input.value?.target !== target.value) return;

      ensureVisible(true, true);
    },
  );

  // Подъём контейнера (шторка поднимается после клавиатуры); опускание — жест
  // закрытия, его не трогаем.
  useAnimatedReaction(
    () => containerPosition?.value ?? 0,
    (position, previous) => {
      if (previous === null || position >= previous) return;

      ensureVisible(false, false);
    },
  );

  const spacerStyle = useAnimatedStyle(() => ({
    height: enabled ? spacerHeight.value : 0,
  }));

  const registry = useMemo<IKeyboardAwareFieldRegistry>(
    () => ({
      register: (tag, containerRef) => {
        fields.modify(refs => {
          "worklet";
          refs[tag] = containerRef;

          return refs;
        });
      },
      unregister: tag => {
        fields.modify(refs => {
          "worklet";
          refs[tag] = undefined;

          return refs;
        });
      },
      notifyLayout: () => {
        layoutVersion.modify(version => {
          "worklet";

          return version + 1;
        });
      },
    }),
    [fields, layoutVersion],
  );

  return useMemo(
    () => ({ registry, spacerRef, spacerStyle, spacerHeight }),
    [registry, spacerRef, spacerStyle, spacerHeight],
  );
};
