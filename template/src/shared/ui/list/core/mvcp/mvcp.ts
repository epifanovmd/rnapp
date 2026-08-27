import type { ListMetrics, ListStore } from "../../model";
import { listDebug } from "../list-debug";
import type { ScrollAdapterRef } from "../scroll";
import type { IAnchor } from "./anchor-picker";
import { pickAnchors, resolveAnchor } from "./anchor-picker";
import { ScreenDrift } from "./screen-drift";
import { ScrollAdjust } from "./scroll-adjust";
import { ShiftQueue } from "./shift-queue";
import { MIN_SHIFT, solveShift } from "./shift-solver";
import { verifyShift } from "./shift-verifier";

export interface IMvcpOptions {
  store: ListStore;
  metrics: ListMetrics;
  adapter: ScrollAdapterRef;
  /** Смещение скролла, каким его считает список. */
  getScroll: () => number;
  getScrollLength: () => number;
  /**
   * Полная высота контента ScrollView — в тех же координатах, что и
   * {@link IMvcpOptions.getScroll}: из неё считается граница скролла, и
   * разъехавшись, они дали бы компенсацию, промахивающуюся у края контента.
   */
  getContentSize: () => number;
  /** Разрешён ли элемент как якорь восстановления. */
  shouldRestorePosition?: (index: number) => boolean;
}

/**
 * Удержание видимой позиции при изменениях выше вьюпорта.
 *
 * Зачем нужно: вставка или удаление выше вьюпорта сдвигает весь контент под
 * собой. Без компенсации подгрузка истории уводит переписку вниз на высоту
 * добавленного, а уточнение размера строки за кадром дёргает всё, что ниже.
 *
 * Как работает: перед изменением снимается якорь — {@link pickAnchors} —
 * запоминается элемент и его позиция. После пересчёта разница позиций якоря и
 * есть то, на сколько уехал контент под ним, и ровно на столько нужно подвинуть
 * скролл.
 *
 * Мерить нужно именно разницу позиций, а не расстояние якоря до кромки
 * вьюпорта. Между снятием якоря и пересчётом проходит кадр, и за этот кадр
 * пользователь успевает проскроллить: расстояние до кромки меняется вместе со
 * скроллом, и его собственное движение попало бы в компенсацию вторым разом.
 * Разница позиций от скролла не зависит вовсе.
 *
 * Сам сдвиг здесь не выполняется — см. {@link ScrollAdjust}: компенсация только
 * пишет новое положение распорки в тот же синхронный проход, что и позиции
 * контейнеров, а `contentOffset` правит нативный слой в той же транзакции.
 */
export class MaintainVisibleContentPosition {
  private readonly options: IMvcpOptions;

  private readonly adjust: ScrollAdjust;
  private readonly queue = new ShiftQueue();
  private readonly drift: ScreenDrift;

  /** Якоря сверху вниз: опорой станет первый переживший изменение. */
  private anchors: IAnchor[] = [];
  /** Якорь снят и ждёт восстановления. */
  private armed = false;
  /** Недоведённая доля точки — дожимается следующим проходом. */
  private residual = 0;

  constructor(options: IMvcpOptions) {
    this.options = options;
    this.adjust = new ScrollAdjust(options.store);
    this.drift = new ScreenDrift(options.metrics);
  }

  /** Идёт компенсация: пороги кромок в это время проверять нельзя. */
  isSettling(): boolean {
    return this.queue.isSettling();
  }

  /**
   * Снять якорь перед изменением раскладки.
   *
   * Повторный вызов до восстановления игнорируется: если в одну пачку попали и
   * измерение ячейки, и смена данных, базой должна остаться раскладка до первого
   * из этих изменений.
   */
  capture(reason: string): void {
    if (this.armed) return;

    this.armed = true;
    this.anchors = [];

    const { metrics, getScroll, getScrollLength, shouldRestorePosition } =
      this.options;
    const scroll = getScroll();

    if (metrics.getCount() === 0) return;

    const { anchors, firstIndex, viewportEnd } = pickAnchors({
      metrics,
      scroll,
      scrollLength: getScrollLength(),
      shouldRestorePosition,
    });

    this.anchors = anchors;

    const anchor = anchors[0];

    if (!anchor) {
      listDebug("mvcp", "якорь не найден", {
        reason,
        scroll,
        first: firstIndex,
        count: metrics.getCount(),
      });

      return;
    }

    listDebug("mvcp", "якорь снят", {
      reason,
      index: anchor.index,
      key: anchor.key,
      position: anchor.position,
      scroll,
      spare: anchors.length - 1,
    });

    this.drift.snapshot(firstIndex, viewportEnd);
  }

  /**
   * На сколько уехал якорь по текущей раскладке.
   *
   * Якорь не расходуется — значение нужно тем, кому раскладку ещё предстоит
   * уточнить: пересчёт диапазона по предсказанному смещению не должен
   * промахнуться ровно на величину будущего сдвига.
   */
  peekShift(): number {
    if (!this.armed) return 0;

    const resolved = resolveAnchor(this.anchors, this.options.metrics);

    return resolved ? resolved.position - resolved.anchor.position : 0;
  }

  /**
   * Компенсировать сдвиг якоря.
   *
   * @returns смещение, каким список должен считать скролл.
   */
  restore(reason: string): number {
    const scroll = this.options.getScroll();

    if (!this.armed) return scroll;

    this.armed = false;

    const captured = this.anchors;
    const resolved = resolveAnchor(captured, this.options.metrics);

    this.anchors = [];

    if (captured.length === 0) return scroll;

    // Ни один из снятых якорей не пережил изменение: восстанавливать не по
    // чему, накопленный остаток сбрасывается.
    if (!resolved) {
      this.residual = 0;
      this.drift.clear();
      listDebug("mvcp", "якоря исчезли", {
        reason,
        first: captured[0]!.key,
        count: captured.length,
      });

      return scroll;
    }

    const { anchor, position } = resolved;

    if (anchor !== captured[0]) {
      listDebug("mvcp", "якорь заменён", {
        reason,
        was: captured[0]!.key,
        now: anchor.key,
      });
    }

    return this.applyShift(reason, anchor, position, scroll);
  }

  /** Расчёт и применение сдвига по выжившему якорю. */
  private applyShift(
    reason: string,
    anchor: IAnchor,
    position: number,
    scroll: number,
  ): number {
    const { getScrollLength, getContentSize, adapter } = this.options;
    const scrollLength = getScrollLength();
    const contentSize = getContentSize();
    const moved = position - anchor.position;

    const solution = solveShift({
      scroll,
      moved,
      residual: this.residual,
      contentSize,
      scrollLength,
    });

    this.residual = solution.residual;

    if (solution.pulledByScrollView !== 0) {
      listDebug("mvcp", "скролл подтянут границей", {
        reason,
        scroll,
        settled: solution.settled,
        maxScroll: solution.maxScroll,
        byScrollView: solution.pulledByScrollView,
      });
    }

    if (solution.lost !== 0) {
      listDebug("mvcp", "упор в границы", {
        reason,
        want: scroll + solution.wanted,
        target: solution.target,
        maxScroll: solution.maxScroll,
        lost: solution.lost,
      });
    }

    if (Math.abs(solution.applied) < MIN_SHIFT) {
      listDebug("mvcp", "сдвиг не нужен", {
        reason,
        key: anchor.key,
        index: anchor.index,
        wanted: solution.wanted,
        residual: this.residual,
      });
      this.drift.report(reason, 0);

      return solution.settled;
    }

    const adjust = this.adjust.add(solution.applied);

    this.queue.push(solution.applied, solution.settled);

    const next = solution.settled + solution.applied;

    listDebug("mvcp", "сдвиг", {
      reason,
      key: anchor.key,
      index: anchor.index,
      moved,
      settled: solution.settled,
      // Скролл на снятии и на восстановлении: расхождение — это то, что
      // пользователь успел проскроллить сам, и в компенсацию оно не входит.
      scrollAtCapture: anchor.scroll,
      scroll,
      next,
      applied: solution.applied,
      residual: this.residual,
      adjust,
      contentSize,
      anchorScroll: anchor.scroll,
      scrollLength,
    });

    this.drift.report(reason, solution.applied);
    verifyShift(adapter, solution.applied);

    return next;
  }

  /** Событие скролла отправлено до применения сдвига — его нужно отбросить. */
  isStaleScroll(offset: number): boolean {
    return this.queue.isStale(offset);
  }

  /** Сброс состояния: применённая компенсация остаётся, ожидания снимаются. */
  reset(): void {
    this.armed = false;
    this.anchors = [];
    this.residual = 0;
    this.drift.clear();
    this.queue.clear();
  }
}
