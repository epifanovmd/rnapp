import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { SharedValue, useSharedValue } from "react-native-reanimated";
import { ICarouselInstance } from "react-native-reanimated-carousel";

export interface ICarouselAutoPlayOptions {
  /** Автопрокрутка запрошена пропом. */
  enabled: boolean;
  /** Интервал ожидания между переходами, мс. */
  interval: number;
  /** Останавливать автопрокрутку насовсем после ручного свайпа. */
  stopOnInteraction: boolean;
  /** Без loop: возобновлять автопрокрутку после отмотки назад с конца. */
  resumeAfterEnd: boolean;
  /** Карусель зациклена; без loop автоплей завершается на последнем слайде. */
  loop: boolean;
  /** Количество слайдов. */
  count: number;
  /** Абсолютный прогресс карусели. */
  progress: SharedValue<number>;
  /** Пишется хуком: палец на карусели / жест активен (пауза контролов). */
  touching: SharedValue<boolean>;
  instanceRef: RefObject<ICarouselInstance | null>;
  /** Пользовательские колбэки — вызываются как обычно. */
  onScrollStart?: () => void;
  onScrollEnd?: (index: number) => void;
  /** Карусель дошла до последнего слайда (любым способом, без дублей). */
  onReachEnd?: () => void;
}

export interface ICarouselAutoPlay {
  /** Автопрокрутка фактически активна (не остановлена вмешательством). */
  effectiveAutoPlay: boolean;
  /** То же для ворклетов: меняется синхронно с остановкой/запуском. */
  autoPlayActive: SharedValue<boolean>;
  /** Активный слайд для контролов; меняется по приземлению. */
  activeIndex: SharedValue<number>;
  /** Длительность цикла слайда, мс. */
  cycleDuration: SharedValue<number>;
  handleTouchStart: () => void;
  handleTouchEnd: () => void;
  handleScrollStart: () => void;
  handleScrollEnd: (index: number) => void;
  /**
   * Пометить следующий переход программным: либа шлёт onScrollStart и для
   * scrollTo/next/prev — без пометки они считались бы ручным свайпом.
   */
  markProgrammatic: () => void;
}

/**
 * Автоплей-движок карусели. Касание/жест ставят отсчёт на паузу с ОСТАТКОМ
 * интервала; отпускание без смены слайда продолжает его. Переход — через
 * next({ onFinished }): следующий интервал стартует по завершению анимации.
 * Смена слайда жестом — остановка насовсем (stopOnInteraction) или полный
 * новый интервал.
 */
export const useCarouselAutoPlay = ({
  enabled,
  interval,
  stopOnInteraction,
  resumeAfterEnd,
  loop,
  count,
  progress,
  touching,
  instanceRef,
  onScrollStart,
  onScrollEnd,
  onReachEnd,
}: ICarouselAutoPlayOptions): ICarouselAutoPlay => {
  const [interacted, setInteracted] = useState(false);
  /** Без loop: дошли до конца (при !resumeAfterEnd — насовсем). */
  const [ended, setEnded] = useState(false);
  const autoPlayActive = useSharedValue(enabled);
  const activeIndex = useSharedValue(0);
  const cycleDuration = useSharedValue(interval);

  const waitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Остаток интервала до следующего перехода. */
  const remainingMs = useRef(interval);
  const waitStartedAt = useRef(0);
  /** Анимация перехода в полёте (между fire и onFinished). */
  const animating = useRef(false);
  /** Жест перетаскивания активен (между onScrollStart и onScrollEnd). */
  const gestureActive = useRef(false);
  const indexAtGesture = useRef(0);
  /** Следующий onScrollStart — от программного перехода, не от жеста. */
  const programmaticNext = useRef(false);
  /** Индекс последнего onScrollEnd — для onReachEnd без дублей. */
  const lastEndIndex = useRef(-1);

  const markProgrammatic = useCallback(() => {
    programmaticNext.current = true;
  }, []);

  const effectiveAutoPlay =
    enabled && !(stopOnInteraction && interacted) && !ended;

  const clearWait = useCallback(() => {
    if (waitTimer.current) {
      clearTimeout(waitTimer.current);
      waitTimer.current = null;
    }
  }, []);

  const startWait = useCallback(() => {
    clearWait();
    // Рестарт ожидания заново включает автоплей для контролов (resumeAfterEnd).
    autoPlayActive.value = true;
    waitStartedAt.current = Date.now();
    waitTimer.current = setTimeout(() => {
      waitTimer.current = null;

      // Без loop next() на последнем слайде — no-op: завершаем автоплей сами.
      if (!loop && Math.round(progress.value) >= count - 1) {
        autoPlayActive.value = false;

        if (!resumeAfterEnd) {
          setEnded(true);
        }

        return;
      }

      animating.current = true;
      programmaticNext.current = true;
      // Сброс в начале цикла: при потерянном onFinished остаток не «залипнет».
      remainingMs.current = interval;

      instanceRef.current?.next({
        onFinished: () => {
          animating.current = false;
          startWait();
        },
      });
    }, remainingMs.current);
  }, [
    clearWait,
    interval,
    instanceRef,
    loop,
    count,
    resumeAfterEnd,
    progress,
    autoPlayActive,
  ]);

  const pauseWait = useCallback(() => {
    if (waitTimer.current) {
      clearWait();
      remainingMs.current = Math.max(
        0,
        remainingMs.current - (Date.now() - waitStartedAt.current),
      );
    }
  }, [clearWait]);

  useEffect(() => {
    autoPlayActive.value = effectiveAutoPlay;

    if (effectiveAutoPlay) {
      remainingMs.current = interval;
      startWait();
    }

    return clearWait;
  }, [effectiveAutoPlay, interval, startWait, clearWait, autoPlayActive]);

  // Пауза на время касания; при перерастании в жест приходит touchCancel,
  // и возобновление откладывается до onScrollEnd.
  const handleTouchStart = useCallback(() => {
    touching.value = true;
    pauseWait();
  }, [touching, pauseWait]);

  const handleTouchEnd = useCallback(() => {
    if (gestureActive.current) {
      return;
    }

    touching.value = false;

    if (!effectiveAutoPlay) {
      return;
    }

    if (animating.current) {
      animating.current = false;
      remainingMs.current = interval;
    }

    startWait();
  }, [touching, effectiveAutoPlay, interval, startWait]);

  // Жест: пауза на время перетаскивания; по завершении — без смены слайда
  // продолжение с остатка, со сменой — остановка или полный цикл.
  const handleScrollStart = useCallback(() => {
    // Программный переход (автоплей, scrollTo/next/prev) — не жест.
    if (programmaticNext.current) {
      programmaticNext.current = false;
      onScrollStart?.();

      return;
    }

    gestureActive.current = true;
    const rounded = Math.round(progress.value);
    const index =
      count === 0
        ? 0
        : loop
          ? ((rounded % count) + count) % count
          : Math.min(Math.max(rounded, 0), count - 1);

    // Если новый свайп начался до onScrollEnd предыдущего, восстанавливаем
    // уже фактически достигнутый индекс один раз на старте жеста. Не следим за
    // Math.round(progress) непрерывно, иначе полоса прыгает на половине слайда.
    if (count > 0 && index !== activeIndex.value) {
      cycleDuration.value = interval;
      activeIndex.value = index;
    }

    indexAtGesture.current = rounded;
    touching.value = true;
    pauseWait();
    onScrollStart?.();
  }, [
    progress,
    loop,
    count,
    activeIndex,
    cycleDuration,
    interval,
    touching,
    pauseWait,
    onScrollStart,
  ]);

  const handleScrollEnd = useCallback(
    (index: number) => {
      onScrollEnd?.(index);

      if (index === count - 1 && lastEndIndex.current !== index) {
        onReachEnd?.();
      }

      lastEndIndex.current = index;

      // Жест/программный переход: слот по приземлению (заодно коррекция,
      // если жест прервал автоплей-анимацию).
      if (index !== activeIndex.value) {
        cycleDuration.value = interval;
        activeIndex.value = index;
      }

      if (!gestureActive.current) {
        return;
      }

      gestureActive.current = false;
      touching.value = false;

      const switched = index !== indexAtGesture.current;

      if (switched && stopOnInteraction) {
        clearWait();
        // Синхронно для ворклетов — до ре-рендера.
        autoPlayActive.value = false;
        setInteracted(true);

        return;
      }

      if (!effectiveAutoPlay) {
        return;
      }

      if (switched || animating.current) {
        animating.current = false;
        remainingMs.current = interval;
      }

      startWait();
    },
    [
      onScrollEnd,
      onReachEnd,
      count,
      activeIndex,
      cycleDuration,
      touching,
      stopOnInteraction,
      effectiveAutoPlay,
      interval,
      clearWait,
      startWait,
      autoPlayActive,
    ],
  );

  return {
    effectiveAutoPlay,
    autoPlayActive,
    activeIndex,
    cycleDuration,
    handleTouchStart,
    handleTouchEnd,
    handleScrollStart,
    handleScrollEnd,
    markProgrammatic,
  };
};
