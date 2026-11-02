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
  cancelAnimation,
  Easing,
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
  withTiming,
} from "react-native-reanimated";

import { isFieldHeightChange } from "./field-layout";
import { shouldCaptureOnEnd } from "./focus-capture";
import { IKeyboardAwareFieldRegistry } from "./keyboard-aware-context";
import {
  computeKeyboardAwareOffset,
  computeMaxScrollOffset,
  IContainerKeyboardShift,
  interpolateScrollOffset,
  keyboardOverlap,
  keyboardProgress,
  predictShiftedViewport,
  shouldScrollTo,
} from "./keyboard-aware-offset";
import {
  computeRestoreOffset,
  restoreFrameOffset,
  shouldRestoreOnHide,
} from "./restore-on-hide";
import { planScrollAnimation } from "./scroll-animation";

export interface IKeyboardAwareScrollOptions {
  /** Зазор между низом поля и клавиатурой, px. По умолчанию 16. */
  bottomOffset?: number;
  /** Выключить докрутку и распорку. По умолчанию `true`. */
  enabled?: boolean;
  /** Перекрытие верха скролла (прозрачный навбар): поле не уводится под него. */
  topInset?: TAnimatedNumber;
  /**
   * Распорка высотой с перекрытие клавиатурой в конце контента — чтобы
   * нижние поля могли подняться. В шторке выключается: шторка сама ужимает
   * область формы над клавиатурой. По умолчанию `true`.
   */
  spacer?: boolean;
  /**
   * При закрытии клавиатуры вернуть скролл покадрово к положению на момент её
   * открытия — если пользователь не скроллил сам и не закрывал клавиатуру
   * пальцем. По умолчанию `true`.
   */
  restoreOnHide?: boolean;
  /**
   * Скролл в контейнере, который двигается над клавиатурой вместе с ней
   * (шторка кита): worklet — подъём и ужатие контейнера при данной высоте
   * клавиатуры. Видимая область считается по ним на конец анимации от
   * замера в покое (`predictShiftedViewport`).
   */
  containerShift?: (keyboardHeight: number) => IContainerKeyboardShift;
  /**
   * Скролл сейчас заблокирован снаружи (шторка gorhom во время своей
   * анимации возвращает его на место): докрутка не запускается, идущая —
   * останавливается, а после снятия блокировки поле докручивается заново.
   */
  scrollLocked?: SharedValue<boolean>;
}

export interface IKeyboardAwareScroll {
  /** Реестр полей — в `KeyboardAwareContext` (его ставит `KeyboardAwareContent`). */
  registry: IKeyboardAwareFieldRegistry;
  /**
   * Ref нулевого якоря — первого элемента контента. По нему поле меряется в
   * координатах контента в одном снимке раскладки, независимо от того, успело
   * ли смещение дойти до shadow tree (важно во время докрутки).
   */
  contentAnchorRef: AnimatedRef<Animated.View>;
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
 * Подключение, от простого к ручному:
 * - контейнеры кита уже подключены: `ScreenScroll`, `BottomSheet.Content`,
 *   `ModalSheet`;
 * - свой скролл — `KeyboardAwareScrollView` (shared/ui) вместо ScrollView;
 * - AnchorList — `useKeyboardAwareAnchorList`:
 *   `keyboardAware.wrap(<AnchorList {...keyboardAware.listProps} ... />)`.
 *
 * Вручную (ref обязан быть animated ref):
 * ```tsx
 * const scrollRef = useAnimatedRef<Animated.ScrollView>();
 * const keyboardAware = useKeyboardAwareScroll(scrollRef, { topInset });
 *
 * <Animated.ScrollView ref={scrollRef}>
 *   <KeyboardAwareContent controller={keyboardAware}>{fields}</KeyboardAwareContent>
 * </Animated.ScrollView>
 * ```
 * `KeyboardAwareContent` — якорь первым, реестр полей и распорка последним.
 * Нижний отступ контента — внутри детей: после распорки отступов быть не должно.
 */
export const useKeyboardAwareScroll = (
  scrollRef: AnimatedRef<Animated.ScrollView>,
  {
    bottomOffset = 16,
    enabled = true,
    topInset = 0,
    spacer = true,
    restoreOnHide = true,
    containerShift,
    scrollLocked,
  }: IKeyboardAwareScrollOptions = {},
): IKeyboardAwareScroll => {
  const { height: screenHeight } = useWindowDimensions();
  const { input } = useReanimatedFocusedInput();

  const fields = useSharedValue<TFieldRefs>({});
  const layoutVersion = useSharedValue(0);
  const spacerRef = useAnimatedRef<Animated.View>();
  const contentAnchorRef = useAnimatedRef<Animated.View>();
  // Сколько контента над якорем (paddingTop контейнера); -1 — не замерено.
  const anchorInset = useSharedValue(-1);

  // Своя докрутка к полю: одна анимация, которую можно перенаправить.
  const animatedOffset = useSharedValue(0);
  const isDriving = useSharedValue(false);
  const driveTarget = useSharedValue(0);
  const driveEnd = useSharedValue(0);
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

  // Возврат при закрытии: положение на момент открытия клавиатуры.
  const savedOffset = useSharedValue(0);
  const hasSaved = useSharedValue(false);
  const userDragged = useSharedValue(false);
  const interactiveDismiss = useSharedValue(false);
  const isRestoring = useSharedValue(false);
  const restoreFrom = useSharedValue(0);
  const restoreTo = useSharedValue(0);

  // Контейнер (шторка): прямоугольник скролла, замеренный в покое.
  const isAnchored = useSharedValue(false);
  const restTop = useSharedValue(0);
  const restHeight = useSharedValue(0);

  const scrollEvents = useEvent<ScrollEvent>(event => {
    "worklet";
    offset.value = event.contentOffset.y;

    if (
      event.eventName.endsWith("onScrollBeginDrag") ||
      event.eventName.endsWith("onMomentumScrollBegin")
    ) {
      isDragging.value = true;

      if (isDriving.value) {
        cancelAnimation(animatedOffset);
        isDriving.value = false;
      }

      if (hasSaved.value || isRestoring.value) userDragged.value = true;
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

  const setOffset = (y: number) => {
    "worklet";
    offset.value = y;
    scrollTo(scrollRef, 0, y, false);
  };

  const stopDrive = () => {
    "worklet";

    if (!isDriving.value) return;

    cancelAnimation(animatedOffset);
    isDriving.value = false;
  };

  /** Немедленный сдвиг (кадр клавиатуры, зажим) — отменяет идущую докрутку. */
  const jumpTo = (y: number) => {
    "worklet";
    stopDrive();
    setOffset(y);
  };

  /** Плавная докрутка; новая цель во время идущей — перенаправление. */
  const animateTo = (goal: number) => {
    "worklet";
    const now = Date.now();
    const plan = planScrollAnimation({
      animating: isDriving.value,
      position: isDriving.value ? animatedOffset.value : offset.value,
      target: driveTarget.value,
      nextTarget: goal,
      remaining: Math.max(driveEnd.value - now, 0),
    });

    if (plan.action === "none") return;

    driveTarget.value = goal;
    driveEnd.value = now + plan.duration;
    isDriving.value = true;
    animatedOffset.value = plan.from;
    animatedOffset.value = withTiming(
      goal,
      { duration: plan.duration, easing: Easing.out(Easing.cubic) },
      finished => {
        if (finished) isDriving.value = false;
      },
    );
  };

  useAnimatedReaction(
    () => animatedOffset.value,
    y => {
      if (isDriving.value && shouldScrollTo(y, offset.value)) setOffset(y);
    },
  );

  /**
   * Начало координат контента в окне. С якорем — из того же снимка раскладки,
   * что и поле; без него (AnchorList) — по смещению из событий скролла.
   */
  const contentOrigin = (viewport: MeasuredDimensions) => {
    "worklet";

    if (anchorInset.value >= 0) {
      const anchor = measure(contentAnchorRef);

      if (anchor) return anchor.pageY - anchorInset.value;
    }

    return viewport.pageY - offset.value;
  };

  /** Замер якоря в покое: клавиатура закрыта, скролл стоит. */
  const captureAnchor = (viewport: MeasuredDimensions) => {
    "worklet";
    const anchor = measure(contentAnchorRef);

    anchorInset.value = anchor
      ? anchor.pageY - viewport.pageY + offset.value
      : -1;
  };

  /** Верх распорки в координатах контента. */
  const captureSpacer = (viewport: MeasuredDimensions) => {
    "worklet";
    const box = measure(spacerRef);

    spacerTop.value = box ? box.pageY - contentOrigin(viewport) : -1;
  };

  /** Замер поля в координатах контента; false — поле не из этого скролла. */
  const captureField = (tag: number) => {
    "worklet";
    hasField.value = false;

    if (tag === NO_TARGET) return false;

    const viewport = measure(scrollRef);

    if (!viewport) return false;

    const origin = contentOrigin(viewport);
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

    if (!containerShift || !isAnchored.value || keyboard <= 0) {
      return { top: viewport.pageY, height: viewport.height };
    }

    return predictShiftedViewport({
      restTop: restTop.value,
      restHeight: restHeight.value,
      shift: containerShift(keyboard),
    });
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
        jumpTo(maxOffset);
      }
    }

    spacerHeight.value = next;
  };

  const ensureVisible = (recapture: boolean, animated: boolean) => {
    "worklet";

    if (!enabled || keyboardHeight.value <= 0 || !hasField.value) return;
    if (scrollLocked?.value) return;

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

    if (!shouldScrollTo(goal, offset.value) && !isDriving.value) return;

    if (animated) animateTo(goal);
    else jumpTo(goal);
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
          stopDrive();
          hasField.value = false;
          isAnimating.value = true;
          captureSpacer(viewport);

          const maxOffset =
            spacerTop.value >= 0
              ? computeMaxScrollOffset(spacerTop.value, 0, viewport.height)
              : MAX_OFFSET_UNKNOWN;

          restoreFrom.value = offset.value;
          restoreTo.value = computeRestoreOffset(savedOffset.value, maxOffset);
          isRestoring.value =
            shouldRestoreOnHide({
              enabled: restoreOnHide,
              hasSaved: hasSaved.value,
              userDragged: userDragged.value,
              interactiveDismiss: interactiveDismiss.value,
            }) && shouldScrollTo(restoreTo.value, restoreFrom.value);
          hasSaved.value = false;

          return;
        }

        // Открытие из закрытого состояния — запомнить, куда вернуться.
        if (from < 1) {
          stopDrive();
          captureAnchor(viewport);
          savedOffset.value = offset.value;
          hasSaved.value = true;
          userDragged.value = false;
          interactiveDismiss.value = false;
        }

        // Контейнер ещё в покое — запомнить его геометрию для прогноза.
        if (containerShift && from < 1) {
          isAnchored.value = true;
          restTop.value = viewport.pageY;
          restHeight.value = viewport.height;
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

        const restoring = isRestoring.value && !userDragged.value;

        if (hiding ? spacerHeight.value <= 0 && !restoring : !hasField.value) {
          return;
        }

        const measured = measure(scrollRef);

        if (!measured) return;

        if (hiding) {
          const viewport = resolveViewport(measured, 0);
          const nextSpacer = spacerFor(viewport, event.height);

          if (restoring) {
            const maxOffset =
              spacerTop.value >= 0
                ? computeMaxScrollOffset(
                    spacerTop.value,
                    Math.min(nextSpacer, spacerHeight.value),
                    viewport.height,
                  )
                : MAX_OFFSET_UNKNOWN;
            const next = restoreFrameOffset(
              restoreFrom.value,
              restoreTo.value,
              keyboardProgress(event.height, keyboardFrom.value, 0),
              maxOffset,
            );

            if (shouldScrollTo(next, offset.value)) jumpTo(next);
          }

          resizeSpacer(viewport, nextSpacer);

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

        if (shouldScrollTo(next, offset.value)) jumpTo(next);
      },
      onInteractive: event => {
        "worklet";
        keyboardHeight.value = event.height;
        interactiveDismiss.value = true;
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

          // Доводка возврата: платформы без покадровых событий.
          if (
            isRestoring.value &&
            !userDragged.value &&
            !isDragging.value &&
            shouldScrollTo(restoreTo.value, offset.value)
          ) {
            if (Math.abs(restoreTo.value - offset.value) > 2) {
              animateTo(restoreTo.value);
            } else {
              jumpTo(restoreTo.value);
            }
          }

          isRestoring.value = false;
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

        if (Math.abs(goal - offset.value) > 2) animateTo(goal);
        else if (shouldScrollTo(goal, offset.value)) jumpTo(goal);
      },
    },
    [
      enabled,
      spacer,
      restoreOnHide,
      bottomOffset,
      screenHeight,
      topInset,
      containerShift,
    ],
  );

  // Блокировка снаружи: докрутка в это время уходила бы впустую — скролл
  // возвращают на место каждый кадр. После снятия — докрутить к полю заново.
  useAnimatedReaction(
    () => scrollLocked?.value ?? false,
    (locked, previous) => {
      if (previous === null || locked === previous) return;

      if (locked) stopDrive();
      else ensureVisible(true, true);
    },
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
    () => ({
      registry,
      contentAnchorRef,
      spacerRef,
      spacerStyle,
      spacerHeight,
    }),
    [registry, contentAnchorRef, spacerRef, spacerStyle, spacerHeight],
  );
};
