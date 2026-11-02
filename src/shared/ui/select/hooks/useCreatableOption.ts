import { useEvent } from "@shared/lib/hooks";
import { useMemo, useRef } from "react";

import type { SelectCreateHandler, SelectOption, SelectValue } from "../types";
import { hasExactOption } from "../utils";

export interface UseCreatableOptionParams<V extends SelectValue> {
  enabled: boolean;
  query: string;
  options: SelectOption<V>[];
  /** Пока грузится или упало — пункт «Создать» не показывается. */
  blocked: boolean;
  onCreate?: SelectCreateHandler<V>;
  /** Выбрать созданное значение. */
  onCreated: (value: V) => void;
}

const isPromiseLike = (value: unknown): value is PromiseLike<unknown> =>
  typeof (value as PromiseLike<unknown> | null)?.then === "function";

/**
 * Пункт «Создать «запрос»»: показывается, когда запрос не совпадает ни с
 * одной опцией точно. `onCreate` может вернуть значение или Promise; повторное
 * нажатие во время создания игнорируется.
 */
export const useCreatableOption = <V extends SelectValue>({
  enabled,
  query,
  options,
  blocked,
  onCreate,
  onCreated,
}: UseCreatableOptionParams<V>) => {
  const createQuery = query.trim();
  const creatingRef = useRef(false);

  const exactMatch = useMemo(
    () => createQuery !== "" && hasExactOption(options, createQuery),
    [options, createQuery],
  );

  const showCreate = enabled && createQuery !== "" && !exactMatch && !blocked;

  const finish = useEvent((value: V | undefined | void) => {
    if (value != null) onCreated(value);
  });

  const create = useEvent(() => {
    if (!createQuery || creatingRef.current) return;

    const result = onCreate?.(createQuery);

    if (!isPromiseLike(result)) {
      finish(result);

      return;
    }

    creatingRef.current = true;
    Promise.resolve(result)
      .then(
        value => finish(value as V | undefined),
        () => undefined,
      )
      .finally(() => {
        creatingRef.current = false;
      });
  });

  return { showCreate, createQuery, create };
};
