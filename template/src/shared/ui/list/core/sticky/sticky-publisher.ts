import type { ListStore } from "../../model";
import { listDebug } from "../list-debug";
import type { StickyAnchors } from "./sticky-anchors";

export interface IStickyPublisherOptions {
  store: ListStore;
  anchors: StickyAnchors;
}

/**
 * Публикация активных якорей в сигналы.
 *
 * Зачем нужна: индекс прилипшего элемента нужен не только самому контейнеру —
 * его читает внешний код через `sharedValues`, чтобы, например, подсветить
 * текущую дату в переписке.
 *
 * Какую проблему решает: возвращает индексы, которые обязаны остаться
 * смонтированными. Прилипший элемент виден у кромки, когда его группа давно за
 * пределами буфера отрисовки, и обычный диапазон его бы отпустил.
 *
 * @returns индексы, удерживаемые вне буфера отрисовки.
 */
export class StickyPublisher {
  private readonly options: IStickyPublisherOptions;

  constructor(options: IStickyPublisherOptions) {
    this.options = options;
  }

  resolve(scroll: number, scrollLength: number): number[] {
    const { store, anchors } = this.options;

    if (!anchors.hasAnchors()) {
      store.set("activeStickyStartIndex", -1);
      store.set("activeStickyEndIndex", -1);

      return [];
    }

    const states = anchors.resolve(scroll, scrollLength);

    for (const state of states) {
      const signal =
        state.edge === "start"
          ? "activeStickyStartIndex"
          : "activeStickyEndIndex";
      const previous = store.peek(signal);

      if (previous !== state.activeIndex) {
        listDebug("sticky", "смена якоря", {
          edge: state.edge,
          from: previous ?? -1,
          to: state.activeIndex,
          limit: state.limit ?? -1,
        });
      }

      store.set(signal, state.activeIndex);
    }

    return anchors.getPinnedIndices(states);
  }
}
