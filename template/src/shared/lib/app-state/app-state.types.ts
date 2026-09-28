import { createInjectDecorator } from "@shared/lib/di";

/**
 * Абстракция над состоянием приложения (активно/свёрнуто).
 * Web: document.visibilityState. React Native: AppState.
 */
export const IAppStateService =
  createInjectDecorator<IAppStateService>("IAppStateService");

export interface IAppStateService {
  readonly isActive: boolean;

  /** Вызывает callback при каждом переходе приложения в активное состояние. Возвращает unsubscribe. */
  onChange(callback: (isActive: boolean) => void): () => void;
}
