import type { ListMetrics } from "../../model";
import type { ListInitialScroll } from "../../types";
import { getItemScrollOffset } from "./item-offset";

export interface IInitialOffsetOptions {
  metrics: ListMetrics;
  getTarget: () => ListInitialScroll | undefined;
  getScrollLength: () => number;
  /** Полная высота контента, включая шапку, подвал и распорки. */
  getContentSize: () => number;
}

/**
 * Вычисление стартовой позиции скролла.
 *
 * Зачем нужно: `initialScroll` задаётся элементом, концом списка или прямым
 * смещением, а нативному слою нужно одно число. Все три случая сводятся здесь.
 *
 * Какую проблему решает: до измерения ячеек размеры оценочные, поэтому цель
 * уезжает от кадра к кадру. {@link isSettled} отвечает на вопрос «цель
 * перестала двигаться» — по нему начальный скролл понимает, что доводить
 * позицию больше не нужно, и список можно показывать.
 */
export class InitialOffsetResolver {
  private readonly options: IInitialOffsetOptions;

  /** Цель прошлой проверки — по ней видно, что позиция устаканилась. */
  private lastOffset: number | undefined;

  constructor(options: IInitialOffsetOptions) {
    this.options = options;
  }

  /** Смещение стартовой позиции; `undefined` — вьюпорт ещё не измерен. */
  resolve(): number | undefined {
    const { metrics, getTarget, getScrollLength, getContentSize } =
      this.options;
    const target = getTarget();
    const scrollLength = getScrollLength();

    if (!target || scrollLength === 0) return undefined;

    if (target.type === "offset") return Math.max(0, target.offset);

    // Конец контента, а не конец элементов: под ними лежит распорка под панель
    // ввода, и по сумме элементов список открывался бы с последней строкой под
    // самой панелью. Отступ приходит замером и на первом кадре ещё не известен
    // — цель уточнится на следующей попытке.
    if (target.type === "end") {
      return Math.max(0, getContentSize() - scrollLength);
    }

    if (target.index < 0 || target.index >= metrics.getCount()) {
      return undefined;
    }

    return getItemScrollOffset({
      position: metrics.getPosition(target.index),
      size: metrics.getSize(target.index),
      scrollLength,
      viewPosition: target.viewPosition,
      viewOffset: target.viewOffset,
    });
  }

  /**
   * Цель перестала уезжать между кадрами — размеры устаканились.
   *
   * Побочный эффект намеренный: каждая проверка запоминает текущую цель, и
   * следующая сравнивается уже с ней.
   */
  isSettled(): boolean {
    const offset = this.resolve();
    const settled = offset !== undefined && offset === this.lastOffset;

    this.lastOffset = offset;

    return settled;
  }
}
