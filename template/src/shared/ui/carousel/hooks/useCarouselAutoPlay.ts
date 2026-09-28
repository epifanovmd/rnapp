import { useCallback, useEffect, useRef, useState } from "react";
import { useSharedValue } from "react-native-reanimated";

import { normalizeCarouselIndex } from "../carousel-math";
import {
  ICarouselAutoplay,
  ICarouselAutoplayOptions,
} from "./carousel-autoplay.types";

export type {
  ICarouselAutoplay,
  ICarouselAutoplayOptions,
} from "./carousel-autoplay.types";

/**
 * Автоплей-движок карусели. Касание/жест ставят отсчёт на паузу с ОСТАТКОМ
 * интервала; отпускание без смены слайда продолжает его. Следующий интервал
 * стартует после подтверждения приземления через onSnapToItem.
 * Смена слайда жестом — остановка насовсем (stopOnInteraction) или полный
 * новый интервал.
 */
export const useCarouselAutoplay = ({
  enabled,
  interval,
  stopOnInteraction,
  resumeAfterEnd,
  loop,
  count,
  initialIndex,
  progress,
  touching,
  instanceRef,
  onScrollStart,
  onSnapToItem,
  onReachEnd,
}: ICarouselAutoplayOptions): ICarouselAutoplay => {
  const [interacted, setInteracted] = useState(false);
  /** Без loop: дошли до конца (при !resumeAfterEnd — насовсем). */
  const [ended, setEnded] = useState(false);
  const normalizedInitialIndex = normalizeCarouselIndex(
    initialIndex,
    count,
    loop,
  );
  const autoplayActive = useSharedValue(enabled);
  const activeIndex = useSharedValue(normalizedInitialIndex);
  const cycleDuration = useSharedValue(interval);

  const waitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Остаток интервала до следующего перехода. */
  const remainingMs = useRef(interval);
  const waitStartedAt = useRef(0);
  /** Анимация перехода в полёте (между next и onSnapToItem). */
  const transitionRunning = useRef(false);
  /** Жест перетаскивания активен (между onScrollStart и onSnapToItem). */
  const gestureActive = useRef(false);
  const indexAtGesture = useRef(normalizedInitialIndex);
  /** Следующий onScrollStart — от программного перехода, не от жеста. */
  const programmaticScrollPending = useRef(false);
  /** onReachEnd уже отправлен для текущего пребывания на последнем слайде. */
  const reachEndReported = useRef(false);

  const effectiveAutoplay =
    enabled && !(stopOnInteraction && interacted) && !ended;

  const clearWait = useCallback(() => {
    if (waitTimer.current !== null) {
      clearTimeout(waitTimer.current);
      waitTimer.current = null;
    }
  }, []);

  const syncActiveIndex = useCallback(
    (index: number) => {
      if (count > 0 && index !== activeIndex.value) {
        cycleDuration.value = interval;
        activeIndex.value = index;
      }
    },
    [count, activeIndex, cycleDuration, interval],
  );

  const resetCycle = useCallback(() => {
    transitionRunning.current = false;
    remainingMs.current = interval;
  }, [interval]);

  const reportReachEnd = useCallback(() => {
    if (reachEndReported.current) {
      return;
    }

    reachEndReported.current = true;
    onReachEnd?.();
  }, [onReachEnd]);

  const startWait = useCallback(() => {
    clearWait();
    // Рестарт ожидания заново включает автоплей для контролов (resumeAfterEnd).
    autoplayActive.value = true;
    waitStartedAt.current = Date.now();
    waitTimer.current = setTimeout(() => {
      waitTimer.current = null;

      const currentIndex = normalizeCarouselIndex(
        Math.round(progress.value),
        count,
        loop,
      );
      const reachedLastSlide = currentIndex === count - 1;

      // При активном автоплее конец считается достигнутым после полного
      // интервала последнего слайда, до остановки или loop-перехода.
      if (reachedLastSlide) {
        reportReachEnd();
      }

      // Без loop next() на последнем слайде — no-op: завершаем автоплей сами.
      if (!loop && reachedLastSlide) {
        autoplayActive.value = false;

        if (!resumeAfterEnd) {
          setEnded(true);
        }

        return;
      }

      transitionRunning.current = true;
      programmaticScrollPending.current = true;
      // Сброс в начале цикла: при потерянном settle остаток не «залипнет».
      remainingMs.current = interval;

      instanceRef.current?.next();
    }, remainingMs.current);
  }, [
    clearWait,
    interval,
    instanceRef,
    loop,
    count,
    resumeAfterEnd,
    progress,
    autoplayActive,
    reportReachEnd,
  ]);

  const pauseWait = useCallback(() => {
    if (waitTimer.current !== null) {
      clearWait();
      remainingMs.current = Math.max(
        0,
        remainingMs.current - (Date.now() - waitStartedAt.current),
      );
    }
  }, [clearWait]);

  /**
   * Переход из внешнего контрола ведёт себя как ручной свайп. При этом
   * следующий onScrollStart остаётся помеченным программным, чтобы не
   * инициализировать одно взаимодействие дважды.
   */
  const beginControlInteraction = useCallback(() => {
    const rounded = Math.round(progress.value);

    programmaticScrollPending.current = true;
    gestureActive.current = true;
    indexAtGesture.current = rounded;
    touching.value = true;
    syncActiveIndex(normalizeCarouselIndex(rounded, count, loop));
    pauseWait();
  }, [progress, touching, syncActiveIndex, count, loop, pauseWait]);

  useEffect(() => {
    autoplayActive.value = effectiveAutoplay;

    if (effectiveAutoplay) {
      remainingMs.current = interval;
      startWait();
    }

    return clearWait;
  }, [effectiveAutoplay, interval, startWait, clearWait, autoplayActive]);

  // Пауза на время касания; при перерастании в жест приходит touchCancel,
  // и возобновление откладывается до onSnapToItem.
  const handleTouchStart = useCallback(() => {
    touching.value = true;
    pauseWait();
  }, [touching, pauseWait]);

  const handleTouchEnd = useCallback(() => {
    if (gestureActive.current) {
      return;
    }

    touching.value = false;

    if (!effectiveAutoplay) {
      return;
    }

    if (transitionRunning.current) {
      resetCycle();
    }

    startWait();
  }, [touching, effectiveAutoplay, resetCycle, startWait]);

  // Жест: пауза на время перетаскивания; по завершении — без смены слайда
  // продолжение с остатка, со сменой — остановка или полный цикл.
  const handleScrollStart = useCallback(() => {
    // Программный переход (автоплей, scrollTo/next/prev) — не жест.
    if (programmaticScrollPending.current) {
      programmaticScrollPending.current = false;
      onScrollStart?.();

      return;
    }

    gestureActive.current = true;
    const rounded = Math.round(progress.value);
    const index = normalizeCarouselIndex(rounded, count, loop);

    // Если новый свайп начался до onSnapToItem предыдущего, восстанавливаем
    // уже фактически достигнутый индекс один раз на старте жеста. Не следим за
    // Math.round(progress) непрерывно, иначе полоса прыгает на половине слайда.
    syncActiveIndex(index);

    indexAtGesture.current = rounded;
    touching.value = true;
    pauseWait();
    onScrollStart?.();
  }, [
    progress,
    loop,
    count,
    syncActiveIndex,
    touching,
    pauseWait,
    onScrollStart,
  ]);

  const handleSnapToItem = useCallback(
    (index: number) => {
      onSnapToItem?.(index);

      if (index !== count - 1) {
        reachEndReported.current = false;
      }

      const isGesture = gestureActive.current;
      const switched = isGesture && index !== indexAtGesture.current;
      const autoplayWillStop = switched && stopOnInteraction;

      // Без автоплея последний слайд считается достигнутым сразу. То же
      // относится к ручному переходу, который сейчас остановит автоплей.
      if (index === count - 1 && (!autoplayActive.value || autoplayWillStop)) {
        reportReachEnd();
      }

      // Жест/программный переход: слот по приземлению (заодно коррекция,
      // если жест прервал автоплей-анимацию).
      syncActiveIndex(index);

      if (!isGesture) {
        if (transitionRunning.current) {
          resetCycle();

          if (effectiveAutoplay && !touching.value) {
            startWait();
          }
        }

        return;
      }

      gestureActive.current = false;
      touching.value = false;

      if (switched && stopOnInteraction) {
        clearWait();
        // Синхронно для ворклетов — до ре-рендера.
        autoplayActive.value = false;
        setInteracted(true);

        return;
      }

      if (!effectiveAutoplay) {
        return;
      }

      if (switched || transitionRunning.current) {
        resetCycle();
      }

      startWait();
    },
    [
      onSnapToItem,
      count,
      reportReachEnd,
      syncActiveIndex,
      touching,
      stopOnInteraction,
      effectiveAutoplay,
      clearWait,
      resetCycle,
      startWait,
      autoplayActive,
    ],
  );

  return {
    effectiveAutoplay,
    autoplayActive,
    activeIndex,
    cycleDuration,
    handleTouchStart,
    handleTouchEnd,
    handleScrollStart,
    handleSnapToItem,
    beginControlInteraction,
  };
};
