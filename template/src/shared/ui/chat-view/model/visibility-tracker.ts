import { IParsedChatMessage } from "./chat-message";

/**
 * Отслеживание видимости — порт `collectVisibleMessageIDs()` и связки
 * throttle/debounce из `ChatViewController+Scroll`.
 *
 * Эталон делает три вещи, которые обычная `onViewableItemsChanged` не умеет:
 *
 * 1. **Гистерезис.** Ячейка попадает в снимок при `visibilityThreshold`
 *    (0.8), а выпадает только ниже `visibilityExitThreshold` (0.5). Без
 *    этого на границе порога список «дребезжит» и шлёт события каждый кадр.
 * 2. **Отдельный порог для прочитанности** (`unreadVisibilityThreshold`,
 *    0.5) — отметить сообщение прочитанным нужно раньше, чем оно попадёт
 *    в снимок видимых.
 * 3. **Разные режимы доставки**: снимок видимых — throttle (нужен
 *    регулярно), непрочитанные — debounce (нужны батчем).
 *
 * Класс держит только состояние гистерезиса и таймеры; сами доли видимости
 * приходят снаружи, из списка.
 */

export interface IVisibleItem {
  index: number;
  message: IParsedChatMessage;
  /** Доля видимой части ячейки, 0..1. */
  visibleFraction: number;
}

export interface IVisibilityThresholds {
  /** Порог входа в снимок видимых (0..1). Порт `visibilityThreshold`. */
  enterThreshold: number;
  /** Порог выхода из снимка (0..1). Порт `visibilityExitThreshold`. */
  exitThreshold: number;
  /** Порог отметки прочитанным (0..1). Порт `unreadVisibilityThreshold`. */
  unreadThreshold: number;
  /** Троттлинг снимка видимых (мс). */
  visibleThrottleMs: number;
  /** Дебаунс батча непрочитанных (мс). */
  unreadDebounceMs: number;
}

export interface IVisibilityTrackerOptions {
  /**
   * Пороги читаются на каждом шаге, а не копируются в конструкторе:
   * хост может поменять их пропом в любой момент, и трекер обязан
   * подхватить новые значения, не теряя состояние гистерезиса.
   */
  getThresholds: () => IVisibilityThresholds;
  onVisibleChange: (messageIds: string[]) => void;
  onUnreadAppear: (messageIds: string[]) => void;
  /** Отметить прочитанными во внутреннем счётчике. */
  onMarkAsRead: (messageIds: Set<string>) => void;
}

export class ChatVisibilityTracker {
  private _options: IVisibilityTrackerOptions;

  /** ID, прошедшие гистерезис на прошлом шаге. Порт `activeVisibleIDs`. */
  private _activeIds = new Set<string>();
  /** Уже отмеченные прочитанными — чтобы не слать повторно. */
  private _seenUnreadIds = new Set<string>();

  private _latestVisibleIds: string[] = [];
  private _lastFiredKey = "";
  private _lastVisibleFireAt = 0;
  private _visibleTimer: ReturnType<typeof setTimeout> | null = null;

  private _pendingUnreadIds = new Set<string>();
  private _unreadTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: IVisibilityTrackerOptions) {
    this._options = options;
  }

  /**
   * Порт `updateVisibleMessages()`: принимает текущие доли видимости,
   * применяет гистерезис и раздаёт события по своим каналам.
   */
  update(items: IVisibleItem[]) {
    const { enterThreshold, exitThreshold, unreadThreshold } =
      this._options.getThresholds();

    const sorted = [...items].sort((a, b) => a.index - b.index);

    const visibleIds: string[] = [];
    const nextActive = new Set<string>();
    const newUnread = new Set<string>();

    for (const { message, visibleFraction } of sorted) {
      const wasActive = this._activeIds.has(message.id);
      const isActive = wasActive
        ? visibleFraction >= exitThreshold
        : visibleFraction >= enterThreshold;

      if (isActive) {
        visibleIds.push(message.id);
        nextActive.add(message.id);
      }

      if (
        visibleFraction >= unreadThreshold &&
        message.ownership === "theirs" &&
        message.status !== "read" &&
        !this._seenUnreadIds.has(message.id)
      ) {
        this._seenUnreadIds.add(message.id);
        newUnread.add(message.id);
      }
    }

    this._activeIds = nextActive;

    if (visibleIds.length > 0) {
      this._latestVisibleIds = visibleIds;
      this._scheduleVisible();
    }

    if (newUnread.size > 0) {
      this._options.onMarkAsRead(newUnread);
      this._scheduleUnread(newUnread);
    }
  }

  dispose() {
    if (this._visibleTimer) clearTimeout(this._visibleTimer);
    if (this._unreadTimer) clearTimeout(this._unreadTimer);
    this._visibleTimer = null;
    this._unreadTimer = null;
  }

  // ─── Throttle снимка видимых (порт notifyVisibleMessages) ────────────────

  private _scheduleVisible() {
    const now = Date.now();
    const interval = this._options.getThresholds().visibleThrottleMs;
    const elapsed = now - this._lastVisibleFireAt;

    if (elapsed >= interval) {
      this._lastVisibleFireAt = now;
      this._fireVisible();

      return;
    }

    // Trailing edge: последнее состояние не должно потеряться.
    if (this._visibleTimer) return;

    this._visibleTimer = setTimeout(() => {
      this._lastVisibleFireAt = Date.now();
      this._visibleTimer = null;
      this._fireVisible();
    }, interval - elapsed);
  }

  private _fireVisible() {
    const ids = this._latestVisibleIds;

    if (ids.length === 0) return;

    const key = ids.join("|");

    if (key === this._lastFiredKey) return;

    this._lastFiredKey = key;
    this._options.onVisibleChange(ids);
  }

  // ─── Debounce батча непрочитанных (порт notifyUnreadMessages) ────────────

  private _scheduleUnread(ids: Set<string>) {
    for (const id of ids) {
      this._pendingUnreadIds.add(id);
    }

    if (this._unreadTimer) clearTimeout(this._unreadTimer);

    this._unreadTimer = setTimeout(() => {
      this._unreadTimer = null;

      if (this._pendingUnreadIds.size === 0) return;

      const batch = [...this._pendingUnreadIds];

      this._pendingUnreadIds.clear();
      this._options.onUnreadAppear(batch);
    }, this._options.getThresholds().unreadDebounceMs);
  }
}
