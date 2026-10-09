import type {
  IAgentEventDto,
  ICursorPageDtoIAgentEventDto,
} from "@shared/api/gen/main/model";
import {
  CursorHolder,
  type IApiResponse,
  isCancelResponse,
} from "@shared/lib/holders";
import { makeAutoObservable, runInAction } from "mobx";

/** Событий на страницу (больше сервер не отдаёт). */
export const AGENT_EVENTS_PAGE_SIZE = 50;

/** Страница ленты по курсору; `undefined` — первая страница. */
export type AgentEventPageFetcher = (
  cursor: string | undefined,
  limit: number,
) => Promise<IApiResponse<ICursorPageDtoIAgentEventDto>>;

const eventKey = (event: IAgentEventDto): string =>
  `${event.agentId}/${event.id}`;

/** Лента событий воркеров с подгрузкой по серверному курсору `nextCursor`. */
export class AgentEventFeed {
  private _holder = new CursorHolder<IAgentEventDto>({
    keyExtractor: eventKey,
    limit: AGENT_EVENTS_PAGE_SIZE,
  });

  private _cursor: string | null = null;

  constructor(private _fetch: AgentEventPageFetcher) {
    makeAutoObservable<this, "_fetch">(
      this,
      { _fetch: false },
      { autoBind: true },
    );
  }

  get items() {
    return this._holder.items;
  }

  get isLoading() {
    return this._holder.isLoading;
  }

  get isLoadingMore() {
    return this._holder.isLoadingMore;
  }

  get hasMore() {
    return this._holder.hasMore;
  }

  get error() {
    return this._holder.error ?? this._holder.loadMoreError;
  }

  /** Новое событие (из сокета) — в начало; уже показанное не дублируется. */
  prepend(event: IAgentEventDto) {
    const key = eventKey(event);

    if (this._holder.items.some(item => eventKey(item) === key)) return;

    this._holder.prependItem(event);
  }

  async load() {
    this._holder.setLoading();

    const res = await this._fetch(undefined, AGENT_EVENTS_PAGE_SIZE);

    if (isCancelResponse(res)) return;

    runInAction(() => {
      if (res.error || !res.data) {
        this._holder.setError(res.error ?? "События недоступны");

        return;
      }

      this._cursor = res.data.nextCursor;
      this._holder.setItems(res.data.items, !!res.data.nextCursor);
    });
  }

  async loadMore() {
    if (!this._cursor || this._holder.isLoadingMore) return;

    this._holder.setLoadingOlder();

    const res = await this._fetch(this._cursor, AGENT_EVENTS_PAGE_SIZE);

    if (isCancelResponse(res)) return;

    runInAction(() => {
      if (res.error || !res.data) {
        this._holder.setOlderError(
          res.error ?? { message: "События недоступны" },
        );

        return;
      }

      this._cursor = res.data.nextCursor;
      this._holder.appendItems(res.data.items, !!res.data.nextCursor);
    });
  }
}
