import { ReactNode } from "react";
import { StyleProp, ViewStyle } from "react-native";

import { ContextMenuCloseResult, IContextMenuSession } from "./types";

/**
 * Синглтон-контроллер открытого меню: элемент просит показать себя, хост
 * подписывается и рисует единственный оверлей. Поэтому меню безопасно вешать
 * на каждый элемент длинного списка.
 */

export interface IContextMenuRequest {
  /** Конфигурация, зафиксированная на момент открытия. */
  session: IContextMenuSession;
  /** Стиль исходного контейнера — для точной копии-«снапшота». */
  sourceStyle?: StyleProp<ViewStyle>;
  /** Children элемента, зафиксированные на момент открытия. */
  content: ReactNode;
  /** Модалка показана — элемент скрывает оригинал. */
  onShown: () => void;
  /** Close-анимация завершена — элемент восстанавливает оригинал. */
  onClosed: (result: ContextMenuCloseResult) => void;
}

class ContextMenuController {
  private _request: IContextMenuRequest | null = null;
  private readonly _listeners = new Set<() => void>();

  get request(): IContextMenuRequest | null {
    return this._request;
  }

  get isPresenting(): boolean {
    return this._request !== null;
  }

  present(request: IContextMenuRequest): boolean {
    if (this._request) {
      return false;
    }

    if (__DEV__ && this._listeners.size === 0) {
      console.warn(
        "[ContextMenuView] Хост не смонтирован — добавьте <ContextMenuView.Host /> в корень приложения.",
      );
    }

    this._request = request;
    this.emit();

    return true;
  }

  finish() {
    if (!this._request) {
      return;
    }

    this._request = null;
    this.emit();
  }

  subscribe = (listener: () => void) => {
    this._listeners.add(listener);

    return () => {
      this._listeners.delete(listener);
    };
  };

  private emit() {
    this._listeners.forEach(listener => listener());
  }
}

export const contextMenuController = new ContextMenuController();
