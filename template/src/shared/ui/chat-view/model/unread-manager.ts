import { IParsedChatMessage } from "./chat-message";

/**
 * Порт UnreadManager: два режима — внутренний (отслеживание ID)
 * и внешний (host задаёт count через проп unreadCount).
 */
export class ChatUnreadManager {
  private _count = 0;
  private _unreadIDs = new Set<string>();
  private _isExternalManagement = false;

  onCountChanged?: (count: number) => void;

  get count(): number {
    return this._count;
  }

  setExternalCount(count: number) {
    this._isExternalManagement = true;
    this._count = count;
    this.onCountChanged?.(count);
  }

  trackAppended(newMessages: IParsedChatMessage[], oldCount: number) {
    if (this._isExternalManagement) return;

    const delta = newMessages.length - oldCount;

    if (delta <= 0) return;

    const appended = newMessages
      .slice(newMessages.length - delta)
      .filter(m => m.ownership === "theirs")
      .map(m => m.id);

    if (appended.length === 0) return;

    for (const id of appended) {
      this._unreadIDs.add(id);
    }
    this._count = this._unreadIDs.size;
    this.onCountChanged?.(this._count);
  }

  markAsRead(ids: Set<string>) {
    if (this._isExternalManagement) return;

    let changed = false;

    for (const id of ids) {
      if (this._unreadIDs.delete(id)) {
        changed = true;
      }
    }
    if (!changed) return;

    this._count = this._unreadIDs.size;
    this.onCountChanged?.(this._count);
  }

  clearAll() {
    this._unreadIDs.clear();
    this._count = 0;
    this._isExternalManagement = false;
    this.onCountChanged?.(0);
  }
}
