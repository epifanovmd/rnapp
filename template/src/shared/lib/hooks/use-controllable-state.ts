import { useCallback, useRef, useState } from "react";

export type StateUpdater<T> = T | ((prev: T) => T);

export interface UseControllableStateOptions<T> {
  /** Управляемое значение; `undefined` — компонент владеет состоянием сам. */
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
}

const resolveUpdater = <T>(updater: StateUpdater<T>, prev: T): T =>
  typeof updater === "function" ? (updater as (prev: T) => T)(prev) : updater;

/**
 * Controlled/uncontrolled в одном контракте: сеттер всегда зовёт `onChange`,
 * а внутреннее состояние обновляет только пока значение не управляется извне.
 */
export const useControllableState = <T>({
  value,
  defaultValue,
  onChange,
}: UseControllableStateOptions<T>): [T, (updater: StateUpdater<T>) => void] => {
  const [internal, setInternal] = useState<T>(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;

  const currentRef = useRef(current);

  currentRef.current = current;

  const setState = useCallback(
    (updater: StateUpdater<T>) => {
      const next = resolveUpdater(updater, currentRef.current);

      if (!isControlled) {
        setInternal(next);
      }

      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [current, setState];
};
