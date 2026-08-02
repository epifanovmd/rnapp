import { makeMutable, SharedValue } from "react-native-reanimated";

import { IStickyAvatar } from "../scroll";

/**
 * Стор sticky-аватаров.
 *
 * Набор аватаров на экране меняется редко (только при переходе через границу
 * группы) — его держит React. Позиция каждого меняется каждый кадр скролла и
 * живёт в shared value, поэтому движение идёт на UI-потоке без ре-рендеров.
 */

export interface IChatAvatarSlot {
  key: string;
  senderName: string;
  senderAvatarUrl?: string;
  y: SharedValue<number>;
}

export class ChatAvatarStore {
  private _slots: IChatAvatarSlot[] = [];
  private readonly _byKey = new Map<string, IChatAvatarSlot>();
  private readonly _listeners = new Set<() => void>();

  getSlots = (): IChatAvatarSlot[] => this._slots;

  subscribe = (listener: () => void) => {
    this._listeners.add(listener);

    return () => {
      this._listeners.delete(listener);
    };
  };

  /** Применить новый снимок: позиции — всегда, состав — только при изменении. */
  sync(avatars: IStickyAvatar[]) {
    let sameSet = avatars.length === this._slots.length;

    for (let i = 0; i < avatars.length; i++) {
      const avatar = avatars[i];
      const slot = this._byKey.get(avatar.key);

      if (slot) {
        slot.y.value = avatar.y;
      }
      if (sameSet && this._slots[i]?.key !== avatar.key) sameSet = false;
    }

    if (sameSet) return;

    const nextByKey = new Map<string, IChatAvatarSlot>();

    this._slots = avatars.map(avatar => {
      const existing = this._byKey.get(avatar.key);
      const slot: IChatAvatarSlot = existing ?? {
        key: avatar.key,
        senderName: avatar.senderName,
        senderAvatarUrl: avatar.senderAvatarUrl,
        y: makeMutable(avatar.y),
      };

      slot.senderName = avatar.senderName;
      slot.senderAvatarUrl = avatar.senderAvatarUrl;
      slot.y.value = avatar.y;
      nextByKey.set(avatar.key, slot);

      return slot;
    });

    this._byKey.clear();
    nextByKey.forEach((slot, key) => this._byKey.set(key, slot));
    this._listeners.forEach(listener => listener());
  }

  clear() {
    if (this._slots.length === 0) return;
    this._slots = [];
    this._byKey.clear();
    this._listeners.forEach(listener => listener());
  }
}
