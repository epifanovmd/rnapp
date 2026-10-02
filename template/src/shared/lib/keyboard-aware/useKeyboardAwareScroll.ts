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

import { isFieldHeightChange } from "./field-layout";
import { shouldCaptureOnEnd } from "./focus-capture";
import { IKeyboardAwareFieldRegistry } from "./keyboard-aware-context";
import {
  computeKeyboardAwareOffset,
  computeMaxScrollOffset,
  interpolateScrollOffset,
  keyboardOverlap,
  keyboardProgress,
  predictAnchoredViewport,
  shouldScrollTo,
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
   * Скролл в контейнере, который сам встаёт над клавиатурой (шторка gorhom).
   * Видимая область считается по цели (`predictAnchoredViewport`), а не по
   * кадру: шторка запускает свою анимацию позже клавиатуры.
   */
  keyboardAnchor?: IKeyboardAnchor;
}

export interface IKeyboardAnchor {
  /** Расстояние от низа скролла до верха клавиатуры при открытой клавиатуре. */
  bottomInset: SharedValue<number>;
  /** Сколько контейнер может подняться (позиция шторки от верха контейнера). */
  liftRoom: SharedValue<number>;
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

/** Видимая область скролла в координатах окна. */
interface IViewportBox {
  top: number;
  height: number;
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
 * при открытой клавиатуре и росте поля (ошибка, multiline); рост во время
 * анимации клавиатуры учитывается в её конце. Пока палец на скролле — не
 * вмешивается.
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
    keyboardAnchor,
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
  const pendingRecapture = useSharedValue(false);

  // Шторка: верх скролла и запас подъёма, замеренные в покое.
  const isAnchored = useSharedValue(false);
  const restTop = useSharedValue(0);
  const restLiftRoom = useSharedValue(0);

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

  /** Видимая область: у шторки — целевая, иначе — замеренная. */
  const resolveViewport = (
    viewport: MeasuredDimensions,
    keyboard: number,
  ): IViewportBox => {
    "worklet";

    if (!keyboardAnchor || !isAnchored.value || keyboard <= 0) {
      return { top: viewport.pageY, height: viewport.height };
    }

    const predicted = predictAnchoredViewport({
      restTop: restTop.value,
      liftRoom: restLiftRoom.value,
      screenHeight,
      keyboardHeight: keyboard,
      bottomInset: keyboardAnchor.bottomInset.value,
    });

    return {
      top: predicted.top,
      height: Math.max(predicted.bottom - predicted.top, 0),
    };
  };

  const spacerFor = (viewport: IViewportBox, keyboard: number) => {
    "worklet";

    return spacer
      ? keyboardOverlap(viewport.top + viewport.height, screenHeight, keyboard)
      : 0;
  };

  /** Целевое смещение по текущей геометрии скролла и высоте клавиатуры. */
  const computeGoal = (viewport: IViewportBox, keyboard: number) => {
    "worklet";
    const reference = startOffset.value;
    const origin = viewport.top - reference;
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
      visibleTop: viewport.top + readAnimatedNumber(topInset),
      viewportBottom: viewport.top + viewport.height,
      screenHeight,
      keyboardHeight: keyboard,
      bottomOffset,
      currentOffset: reference,
      maxOffset,
    });
  };

  /** Новая высота распорки; при уменьшении смещение не выходит за контент. */
  const resizeSpacer = (viewport: IViewportBox, next: number) => {
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

    if (!enabled || keyboardHeight.value <= 0 || !hasField.value) return;

    // Рост поля во время анимации клавиатуры — учесть в её конце.
    if (isAnimating.value) {
      pendingRecapture.value = pendingRecapture.value || recapture;

      return;
    }

    if (isDragging.value) return;
    if (recapture && !captureField(target.value)) return;

    const measured = measure(scrollRef);

    if (!measured) return;

    const goal = computeGoal(
      resolveViewport(measured, keyboardHeight.value),
      keyboardHeight.value,
    );

    if (shouldScrollTo(goal, offset.value)) setOffset(goal, animated);
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

        // Шторка ещё в покое — запомнить её геометрию для прогноза.
        if (keyboardAnchor && from < 1) {
          isAnchored.value = true;
          restTop.value = viewport.pageY;
          restLiftRoom.value = keyboardAnchor.liftRoom.value;
        }

        pendingRecapture.value = false;

        if (!captureField(event.target)) {
          isAnimating.value = false;

          return;
        }

        // Распорка резервируется сразу: layout отстаёт на кадр, иначе
        // scrollTo у самого низа упрётся в ещё не выросший контент.
        spacerHeight.value = Math.max(
          spacerHeight.value,
          spacerFor(resolveViewport(viewport, event.height), event.height),
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

        const measured = measure(scrollRef);

        if (!measured) return;

        if (hiding) {
          const viewport = resolveViewport(measured, 0);

          resizeSpacer(viewport, spacerFor(viewport, event.height));

          return;
        }

        // Цель пересчитывается каждый кадр по видимой области на конец анимации.
        const goal = computeGoal(
          resolveViewport(measured, keyboardTo.value),
          keyboardTo.value,
        );

        // Поле и так видно — ни одного scrollTo за анимацию.
        if (!shouldScrollTo(goal, startOffset.value)) return;

        const progress = keyboardProgress(
          event.height,
          keyboardFrom.value,
          keyboardTo.value,
        );
        const next = interpolateScrollOffset(startOffset.value, goal, progress);

        if (shouldScrollTo(next, offset.value)) setOffset(next, false);
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

        const measured = measure(scrollRef);

        if (!measured) return;

        if (event.height <= 0) {
          hasField.value = false;
          isAnchored.value = false;
          pendingRecapture.value = false;
          resizeSpacer(resolveViewport(measured, 0), 0);

          return;
        }

        const pending = pendingRecapture.value;

        pendingRecapture.value = false;

        // Тег из onStart мог быть устаревшим (первый респондер ещё не
        // сменился) — onEnd несёт актуальный.
        const captureTag = shouldCaptureOnEnd({
          keyboardHeight: event.height,
          hasField: hasField.value,
          capturedTarget: hasField.value ? target.value : NO_TARGET,
          endTarget: event.target,
          pendingRecapture: pending,
        })
          ? event.target
          : pending && hasField.value
            ? target.value
            : NO_TARGET;

        if (isDragging.value) return;

        if (captureTag !== NO_TARGET) {
          if (!captureField(captureTag)) return;
        } else if (!hasField.value || !wasAnimating) {
          return;
        }

        const viewport = resolveViewport(measured, event.height);

        resizeSpacer(
          viewport,
          Math.max(spacerHeight.value, spacerFor(viewport, event.height)),
        );

        // Доводка: платформы без покадровых событий и рост поля за анимацию.
        const goal = computeGoal(viewport, event.height);

        if (shouldScrollTo(goal, offset.value)) {
          setOffset(goal, Math.abs(goal - offset.value) > 2);
        }
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
  // Смена фокуса — не рост: её ведёт onStart/onEnd.
  useAnimatedReaction(
    () => ({
      target: input.value?.target ?? NO_TARGET,
      height: input.value?.layout.height ?? 0,
    }),
    (current, previous) => {
      if (!previous || current.target !== previous.target) return;
      if (!isFieldHeightChange(previous.height, current.height)) return;
      if (current.target !== target.value) return;

      ensureVisible(true, true);
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
