import type { IContainerRequest, ListMetrics, ListStore } from "../../model";
import { ContainerPool, POSITION_OUT_OF_VIEW } from "../../model";
import { listDebug } from "../list-debug";
import { resolveContainerPlacement } from "./container-placement";

export interface IContainerBinderOptions {
  store: ListStore;
  metrics: ListMetrics;
  pool: ContainerPool;
  getItem: (index: number) => unknown;
  /** Предел смещения прилипшего элемента. */
  getStickyLimit: (index: number) => number | undefined;
}

export interface IBindParams {
  requests: IContainerRequest[];
  viewportTop: number;
  viewportEnd: number;
}

/**
 * Привязка контейнеров к элементам и раскладка их позиций.
 *
 * Зачем нужна: контейнер — единица монтирования. Он переживает смену элемента,
 * меняя пропы вместо перемонтирования поддерева, и всё, что список сообщает
 * дереву о содержимом ячейки, уходит адресными сигналами именно его номера.
 *
 * Какие проблемы решает:
 * - **освобождённый контейнер уводится за пределы контента**, но только если он
 *   действительно остался без привязки: тот же контейнер мог тут же уйти под
 *   другой элемент, и уводить его тогда нельзя;
 * - **сигналы пишутся для всех запрошенных элементов**, а не только для
 *   сменивших привязку. Элемент может остаться на своём месте с новым объектом
 *   данных — так приходит правка сообщения, — и ячейка обязана его увидеть.
 *   Стор сравнивает значения по ссылке, поэтому лишних перерисовок это не даёт.
 */
export class ContainerBinder {
  private readonly options: IContainerBinderOptions;

  constructor(options: IContainerBinderOptions) {
    this.options = options;
  }

  /** Разложить запрошенные элементы по контейнерам и опубликовать сигналы. */
  bind({ requests, viewportTop, viewportEnd }: IBindParams): void {
    const { store, pool } = this.options;
    const { released, count } = pool.allocate(requests);

    for (const id of released) {
      if (pool.getBinding(id) !== undefined) continue;

      store.set(`containerPosition${id}`, POSITION_OUT_OF_VIEW);
      store.set(`containerSticky${id}`, null);
    }

    for (const request of requests) {
      const id = pool.getContainerByKey(request.key);

      if (id === undefined) continue;

      this.publish(id, request, viewportTop, viewportEnd);
    }

    store.set("numContainers", count);
  }

  /** Все контейнеры остаются без элементов — список опустел. */
  releaseAll(): void {
    const { store, pool } = this.options;
    const { released, count } = pool.allocate([]);

    for (const id of released) {
      store.set(`containerPosition${id}`, POSITION_OUT_OF_VIEW);
    }

    store.set("numContainers", count);
  }

  /** Сигналы одного контейнера. */
  private publish(
    id: number,
    request: IContainerRequest,
    viewportTop: number,
    viewportEnd: number,
  ): void {
    const { store, metrics, getItem, getStickyLimit } = this.options;
    const placement = resolveContainerPlacement({
      pending: metrics.isPending(request.key),
      stickyEdge: request.stickyEdge,
      position: metrics.getPosition(request.index),
      size: metrics.getSize(request.index),
      viewportTop,
      viewportEnd,
    });

    const previousPosition = store.peek(`containerPosition${id}`);

    if (
      previousPosition !== undefined &&
      previousPosition !== placement.position
    ) {
      listDebug("position", "контейнер сместился", {
        id,
        index: request.index,
        key: request.key,
        from: previousPosition,
        to: placement.position,
        delta: placement.position - previousPosition,
      });
    }

    store.set(`containerClipped${id}`, placement.clipped);
    store.set(`containerItemKey${id}`, request.key);
    store.set(`containerItemIndex${id}`, request.index);
    store.set(`containerItemData${id}`, getItem(request.index));
    store.set(`containerPosition${id}`, placement.position);
    store.set(`containerItemSize${id}`, placement.size);
    store.set(`containerSticky${id}`, request.stickyEdge);
    store.set(
      `containerStickyLimit${id}`,
      request.stickyEdge ? getStickyLimit(request.index) : undefined,
    );
    store.notifyPosition(request.key, placement.position);
  }
}
