import type { ListStore } from "../../model";
import { listDebug } from "../list-debug";

/**
 * Дальше этой суммарной компенсации смещение распорки теряет точность.
 *
 * Позиция распорки — `BIAS + adjust`, а Yoga хранит её во float32: целые
 * значения точны только до 2^24. Запас до предела логируется, чтобы упереться
 * в него не молча.
 */
const ADJUST_SAFE_LIMIT = 4_000_000;

/**
 * Накопленное положение распорки компенсации.
 *
 * Зачем нужно: сам сдвиг выполняет нативный ScrollView. Ему передан
 * `maintainVisibleContentPosition`, а первым ребёнком контента лежит распорка
 * нулевого размера: нативный код запоминает её кадр перед mount-транзакцией и
 * после неё добавляет смещение кадра к `contentOffset`. Это единственный способ
 * поменять смещение скролла в той же транзакции, что и раскладку — программный
 * `scrollTo` пришёл бы отдельным кадром (видимый прыжок) и оборвал бы жест и
 * инерцию.
 *
 * Какую проблему решает: величина здесь именно накопительная, а не разовая.
 * Нативный слой смотрит на смещение кадра распорки между транзакциями, поэтому
 * сбросить её в ноль значит сделать обратный сдвиг на всю накопленную сумму.
 */
export class ScrollAdjust {
  private readonly store: ListStore;
  /** Накопленная компенсация, целые точки. */
  private adjust = 0;

  constructor(store: ListStore) {
    this.store = store;
  }

  get(): number {
    return this.adjust;
  }

  /** Добавить сдвиг и опубликовать новое положение распорки. */
  add(applied: number): number {
    this.adjust += applied;
    this.store.set("scrollAdjust", this.adjust);

    if (Math.abs(this.adjust) > ADJUST_SAFE_LIMIT) {
      listDebug("mvcp", "распорка у предела точности", {
        adjust: this.adjust,
        limit: ADJUST_SAFE_LIMIT,
      });
    }

    return this.adjust;
  }
}
