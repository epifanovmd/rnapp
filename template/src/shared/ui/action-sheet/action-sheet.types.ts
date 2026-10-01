import type { TIconName } from "../icon";

/** Пункт шторки действий; `key` возвращается в `onSelect`. */
export interface IActionSheetItem<TKey extends string = string> {
  key: TKey;
  title: string;
  description?: string;
  icon?: TIconName;
  /** Опасное действие — красный акцент. */
  destructive?: boolean;
  disabled?: boolean;
}

export interface IActionSheetProps<TKey extends string = string> {
  title?: string;
  items: readonly IActionSheetItem<TKey>[];
  /** Вызывается после закрытия шторки: системные экраны не открываются поверх модалки. */
  onSelect: (key: TKey) => void;
  cancelLabel?: string;
  /** Открывается из другого листа — поверх него (см. `TBottomSheetProps.nested`). */
  nested?: boolean;
}
