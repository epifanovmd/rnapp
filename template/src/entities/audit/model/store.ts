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

  constructor(@IMainApi() private _api: IMainApi) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get events() {
    return this.eventsHolder.items;
  }

  async load() {
    const holder = this.eventsHolder;

    holder.setLoading();

    const res = await this._api.getMyAudit({ limit: holder.limit });

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

    holder.setLoadingOlder();

    const res = await this._api.getMyAudit({ cursor, limit: holder.limit });

    if (res.error) {
      holder.setOlderError(res.error);

      return;
    }

    this._setCursor(res.data.nextCursor);
    holder.appendItems(res.data.items, res.data.nextCursor !== null);
  }

  reset() {
    this._nextCursor = null;
    this.eventsHolder.reset();
  }

  private _setCursor(cursor: string | null) {
    this._nextCursor = cursor;
  }
}
