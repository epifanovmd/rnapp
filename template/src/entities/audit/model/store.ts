import { IMainApi } from "@shared/api";
import type { AuditEventDto } from "@shared/api/gen/main/model";
import { CursorHolder } from "@shared/lib/holders";
import { injectable } from "inversify";
import { makeAutoObservable } from "mobx";

import { IAuditStore } from "./types";

const PAGE_SIZE = 20;

@injectable()
export class AuditStore implements IAuditStore {
  public eventsHolder = new CursorHolder<AuditEventDto>({
    keyExtractor: event => event.id,
    limit: PAGE_SIZE,
  });

  /** Непрозрачный курсор следующей страницы; `null` — страниц больше нет. */
  private _nextCursor: string | null = null;
  /** Поколение ленты: ответы прежних `load`/`loadMore` и до `reset` не применяются. */
  private _generation = 0;

  constructor(@IMainApi() private _api: IMainApi) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get events() {
    return this.eventsHolder.items;
  }

  async load() {
    const holder = this.eventsHolder;
    const generation = this._nextGeneration();

    holder.setLoading();

    const res = await this._api.getMyAudit({ limit: holder.limit });

    if (generation !== this._generation) return;

    if (res.error) {
      if (!res.error.isCanceled) holder.setError(res.error);

      return;
    }

    this._setCursor(res.data.nextCursor);
    holder.setItems(res.data.items, res.data.nextCursor !== null);
  }

  async loadMore() {
    const holder = this.eventsHolder;
    const cursor = this._nextCursor;

    if (!cursor || holder.isLoadingMore || holder.isLoading) return;

    const generation = this._generation;

    holder.setLoadingOlder();

    const res = await this._api.getMyAudit({ cursor, limit: holder.limit });

    if (generation !== this._generation) return;

    if (res.error) {
      holder.setOlderError(res.error);

      return;
    }

    this._setCursor(res.data.nextCursor);
    holder.appendItems(res.data.items, res.data.nextCursor !== null);
  }

  prepend(event: AuditEventDto) {
    const holder = this.eventsHolder;

    // До первой загрузки лента пустая — событие придёт вместе с ней.
    if (!holder.isSuccess || holder.items.some(e => e.id === event.id)) return;

    holder.prependItem(event);
  }

  reset() {
    this._nextGeneration();
    this.eventsHolder.reset();
  }

  /** Новое поколение ленты; курсор прежнего больше не действует. */
  private _nextGeneration() {
    this._nextCursor = null;

    return ++this._generation;
  }

  private _setCursor(cursor: string | null) {
    this._nextCursor = cursor;
  }
}
