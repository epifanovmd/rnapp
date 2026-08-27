import { useCallback, useState, useSyncExternalStore } from "react";

import type { ListSignalMap, ListSignalName } from "../model";
import { ListState } from "../model";

/**
 * Доступ к состоянию списка из компонентов вне его дерева.
 *
 * Объект стабилен и создаётся один раз: его отдают списку пропом `state`, а
 * читают через {@link useListValue} — в том же компоненте или в любом другом,
 * куда его передали.
 *
 * Подписаться можно до того, как список смонтируется: до этого значения просто
 * `undefined`, а с появлением списка подписки перевешиваются на него сами.
 */
export const useListState = (): ListState => {
  const [state] = useState(() => new ListState());

  return state;
};

/**
 * Одно значение состояния списка с перерисовкой на его изменение.
 *
 * Подписка адресная: компонент перерисуется только тогда, когда изменится
 * именно это значение, а не любое состояние списка.
 *
 * Для анимаций сюда ходить не нужно — `sharedValues` отдаёт то же самое на
 * UI-поток вообще без рендера. Этот хук для случаев, когда значение правда
 * нужно в React: число на экране, флаг в пропе, ветка в разметке.
 */
export const useListValue = <TName extends ListSignalName>(
  state: ListState,
  name: TName,
): ListSignalMap[TName] | undefined => {
  const subscribe = useCallback(
    (onChange: () => void) => state.listen(name, onChange),
    [state, name],
  );

  const getSnapshot = useCallback(() => state.peek(name), [state, name]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
