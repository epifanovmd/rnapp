import { action, computed, makeObservable, observable } from "mobx";

import { BaseListHolder } from "./BaseListHolder";
import { HolderStatus, IHolderError, MutationStatus } from "./HolderTypes";

// ─────────────────────────────────────────────────────────────────────────────

export interface ICursorHolderOptions<TItem> {
  /** Извлекатель ключа для CRUD-хелперов и дедупликации. */
  keyExtractor: (item: TItem) => string | number;
  /** Элементов на страницу (default: 40). */
  limit?: number;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Холдер для списков с **cursor-based двунаправленной пагинацией**.
 *
 * Не управляет offset — вместо этого хранит cursor ID (первый / последний
 * элемент) и предоставляет их для внешнего формирования запросов.
 *
 * Два направления подгрузки:
 * - **older** (вверх): `hasMore` + `loadMoreStatus` + `appendItems()`
 * - **newer** (вниз): `hasNewer` + `loadNewerStatus` + `prependItems()`
 *
 * Items хранятся в DESC порядке (newest first) — стандартный формат чатов.
 *
 * @example
 * ```ts
 * messagesHolder = new CursorHolder<MessageDto>({
 *   keyExtractor: m => m.id,
 *   limit: 40,
 * });
 *
 * // Initial load
 * const res = await api.getMessages({ chatId, limit: 40 });
 * messagesHolder.setItems(res.data, res.hasMore);
 *
 * // Load older
 * messagesHolder.setLoadingOlder();
 * const older = await api.getMessages({ chatId, before: messagesHolder.oldestCursor });
 * messagesHolder.appendItems(older.data, older.hasMore);
 *
 * // Load newer (bidirectional)
 * messagesHolder.setLoadingNewer();
 * const newer = await api.getMessages({ chatId, after: messagesHolder.newestCursor });
 * messagesHolder.prependItems(newer.data, newer.hasNewer);
 *
 * // Around navigation
 * messagesHolder.setLoading();
 * const around = await api.getMessages({ chatId, around: messageId });
 * messagesHolder.setItems(around.data, around.hasMore, around.hasNewer);
 * ```
 */
export class CursorHolder<
  TItem,
  TError extends IHolderError = IHolderError,
> extends BaseListHolder<TItem, TError> {
  // ─── Older direction (scroll up / load more) ──────────────────────────

  /** There are older items on the server. */
  hasMore: boolean = false;
  /** Status of "load older" operation. */
  loadMoreStatus = MutationStatus.Idle;
  loadMoreError: TError | null = null;

  // ─── Newer direction (scroll down from detached window) ───────────────

  /** There are newer items on the server. */
  hasNewer: boolean = false;
  /** Status of "load newer" operation. */
  loadNewerStatus = MutationStatus.Idle;
  loadNewerError: TError | null = null;

  private readonly _limit: number;

  constructor(options: ICursorHolderOptions<TItem>) {
    super(options.keyExtractor);

    this._limit = options.limit ?? 40;

    makeObservable(this, {
      hasMore: observable,
      loadMoreStatus: observable,
      loadMoreError: observable.ref,
      hasNewer: observable,
      loadNewerStatus: observable,
      loadNewerError: observable.ref,

      isLoadingMore: computed,
      isLoadMoreError: computed,
      isLoadingNewer: computed,
      isLoadNewerError: computed,
      newestCursor: computed,
      oldestCursor: computed,
      limit: computed,

      setItems: action,
      appendItems: action,
      prependItems: action,
      prependItem: action,
      appendItem: action,
      removeItem: action,
      setLoadingOlder: action,
      setLoadingNewer: action,
      reset: action,
    });
  }

  // ─── Computed ──────────────────────────────────────────────────────────

  get isLoadingMore() {
    return this.loadMoreStatus === MutationStatus.Loading;
  }

  get isLoadMoreError() {
    return this.loadMoreStatus === MutationStatus.Error;
  }

  get isLoadingNewer() {
    return this.loadNewerStatus === MutationStatus.Loading;
  }

  get isLoadNewerError() {
    return this.loadNewerStatus === MutationStatus.Error;
  }

  /** Key of the newest item (first in DESC list). Null if empty. */
  get newestCursor(): string | number | null {
    if (this.items.length === 0 || !this._keyExtractor) return null;

    return this._keyExtractor(this.items[0]);
  }

  /** Key of the oldest item (last in DESC list). Null if empty. */
  get oldestCursor(): string | number | null {
    if (this.items.length === 0 || !this._keyExtractor) return null;

    return this._keyExtractor(this.items[this.items.length - 1]);
  }

  get limit() {
    return this._limit;
  }

  // ─── State setters ────────────────────────────────────────────────────

  /**
   * Replace all items. Used for initial load and around-navigation.
   */
  setItems(items: TItem[], hasMore: boolean, hasNewer: boolean = false) {
    this.items = items;
    this.hasMore = hasMore;
    this.hasNewer = hasNewer;
    this.status = HolderStatus.Success;
    this.error = null;
    this.loadMoreStatus = MutationStatus.Idle;
    this.loadMoreError = null;
    this.loadNewerStatus = MutationStatus.Idle;
    this.loadNewerError = null;
  }

  /**
   * Append older items to the end of the list (scroll up).
   */
  appendItems(items: TItem[], hasMore: boolean) {
    if (items.length > 0) {
      const existingKeys = new Set(this.items.map(this._keyExtractor!));
      const newItems = items.filter(
        item => !existingKeys.has(this._keyExtractor!(item)),
      );

      this.items = [...this.items, ...newItems];
    }

    this.hasMore = hasMore;
    this.loadMoreStatus = MutationStatus.Success;
    this.loadMoreError = null;
  }

  /**
   * Prepend newer items to the beginning of the list (scroll down from detached).
   * Deduplicates by keyExtractor.
   */
  prependItems(items: TItem[], hasNewer: boolean) {
    if (items.length > 0) {
      const existingKeys = new Set(this.items.map(this._keyExtractor!));
      const newItems = items.filter(
        item => !existingKeys.has(this._keyExtractor!(item)),
      );

      this.items = [...newItems, ...this.items];
    }

    this.hasNewer = hasNewer;
    this.loadNewerStatus = MutationStatus.Success;
    this.loadNewerError = null;
  }

  /** Mark "load older" as in-progress. Call before your API request. */
  setLoadingOlder() {
    this.loadMoreStatus = MutationStatus.Loading;
    this.loadMoreError = null;
  }

  /** Mark "load newer" as in-progress. Call before your API request. */
  setLoadingNewer() {
    this.loadNewerStatus = MutationStatus.Loading;
    this.loadNewerError = null;
  }

  /** Mark "load older" as failed. */
  setOlderError(error: TError) {
    this.loadMoreStatus = MutationStatus.Error;
    this.loadMoreError = error;
  }

  /** Mark "load newer" as failed. */
  setNewerError(error: TError) {
    this.loadNewerStatus = MutationStatus.Error;
    this.loadNewerError = error;
  }

  reset() {
    this.items = [];
    this.status = HolderStatus.Idle;
    this.error = null;
    this.hasMore = false;
    this.hasNewer = false;
    this.loadMoreStatus = MutationStatus.Idle;
    this.loadMoreError = null;
    this.loadNewerStatus = MutationStatus.Idle;
    this.loadNewerError = null;
  }

  // ─── CRUD helpers ─────────────────────────────────────────────────────

  prependItem(item: TItem) {
    this.items = [item, ...this.items];
  }

  appendItem(item: TItem) {
    this.items = [...this.items, item];
  }

  removeItem(predicate: ((item: TItem) => boolean) | string | number) {
    const fn = this._normalizePredicate(predicate);

    this.items = this.items.filter(item => !fn(item));
  }
}
