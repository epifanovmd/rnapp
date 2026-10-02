/**
 * Память об экранах стека, чья анимация открытия завершилась. Вложенный экран
 * (вкладка внутри экрана стека) может смонтироваться позже `transitionEnd`, и
 * без памяти ждал бы события, которое уже прошло.
 */
export interface ITransitionTracker {
  markOpened: (routeKey: string) => void;
  forget: (routeKey: string) => void;
  isOpened: (routeKey: string) => boolean;
  subscribe: (listener: () => void) => () => void;
}

export const createTransitionTracker = (): ITransitionTracker => {
  const opened = new Set<string>();
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach(listener => listener());

  return {
    markOpened: routeKey => {
      if (opened.has(routeKey)) return;

      opened.add(routeKey);
      notify();
    },
    forget: routeKey => {
      if (opened.delete(routeKey)) notify();
    },
    isOpened: routeKey => opened.has(routeKey),
    subscribe: listener => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
};

/** Трекер приложения: питается слушателями стеков (`screenTransitionListeners`). */
export const screenTransitions = createTransitionTracker();

interface ITransitionEvent {
  data?: { closing?: boolean };
}

/**
 * Слушатели экранов стека для `screenListeners` навигатора: открытие
 * запоминается по `transitionEnd`, начало закрытия — забывается.
 */
export const screenTransitionListeners = ({
  route,
}: {
  route: { key: string };
}) => ({
  transitionEnd: (event: ITransitionEvent) => {
    if (!event.data?.closing) screenTransitions.markOpened(route.key);
  },
  transitionStart: (event: ITransitionEvent) => {
    if (event.data?.closing) screenTransitions.forget(route.key);
  },
});
