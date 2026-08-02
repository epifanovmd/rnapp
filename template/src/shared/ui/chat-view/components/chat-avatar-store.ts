import { makeMutable, SharedValue } from "react-native-reanimated";

import { IStickyAvatar } from "../scroll";

/**
 * Стор sticky-аватаров.
 *
 * Набор аватаров на экране меняется редко (только при переходе через границу
 * группы) — его держит React. Границы групп тоже статичны и живут в shared
 * values. Позиция каждого меняется каждый кадр скролла и считается на
 * UI-потоке из `scrollY` + границ (см. ChatAvatarLayer), поэтому движение идёт
 * без ре-рендеров и без JS-потока.
 */

export interface IChatAvatarSlot {
  key: string;
  senderName: string;
  senderAvatarUrl?: string;
  /** Позиция от верха видимой области — ведёт UI-поток. */
  y: SharedValue<number>;
  /** Верхняя граница группы (координаты контента). */
  top: SharedValue<number>;
  /** Нижняя граница группы (координаты контента). */
  bottom: SharedValue<number>;
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

  /** Применить новый снимок: границы — всегда, состав — только при изменении. */
  sync(avatars: IStickyAvatar[]) {
    let sameSet = avatars.length === this._slots.length;

    for (let i = 0; i < avatars.length; i++) {
      const avatar = avatars[i];
      const slot = this._byKey.get(avatar.key);

      if (slot) {
        slot.top.value = avatar.top;
        slot.bottom.value = avatar.bottom;
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
        y: makeMutable(0),
        top: makeMutable(avatar.top),
        bottom: makeMutable(avatar.bottom),
      };

      slot.senderName = avatar.senderName;
      slot.senderAvatarUrl = avatar.senderAvatarUrl;
      slot.top.value = avatar.top;
      slot.bottom.value = avatar.bottom;
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
