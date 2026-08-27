import { useCallback, useMemo, useState } from "react";

import type { LabRow } from "./lab-data";
import { createMessages, withDateSeparators } from "./lab-data";

/** Сколько сообщений в списке на старте. */
const INITIAL_FROM = 1000;
const INITIAL_TO = 2000;
/** Сколько добавляет одна подгрузка. */
const PAGE_SIZE = 40;
/** Задержка ответа: подгрузка обязана приходить посреди скролла, как в жизни. */
const LOAD_DELAY_MS = 400;

export interface IPerfPagination {
  rows: LabRow[];
  /** Индексы разделителей дат — якоря прилипания. */
  dateIndices: number[];
  from: number;
  to: number;
  onStartReached: () => void;
  onEndReached: () => void;
}

/**
 * Данные стендов производительности: тысяча сообщений и подгрузка в обе стороны.
 *
 * Общий на два стенда намеренно: сравнивать реализации списка можно только на
 * одних и тех же данных и одном и том же поведении подгрузки.
 */
export const usePerfPagination = (): IPerfPagination => {
  const [range, setRange] = useState({ from: INITIAL_FROM, to: INITIAL_TO });
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingEnd, setLoadingEnd] = useState(false);

  const messages = useMemo(
    () => withDateSeparators(createMessages(range.from, range.to)),
    [range],
  );

  const rows = useMemo<LabRow[]>(() => {
    if (!loadingStart && !loadingEnd) return messages.rows;

    const data: LabRow[] = [...messages.rows];

    if (loadingStart) {
      data.unshift({ type: "loader", key: "loader-start", edge: "start" });
    }

    if (loadingEnd) {
      data.push({ type: "loader", key: "loader-end", edge: "end" });
    }

    return data;
  }, [messages, loadingStart, loadingEnd]);

  // Спиннер сверху сдвигает всё под собой: якоря прилипания адресуются
  // индексами, и без поправки они уехали бы на строку.
  const dateIndices = useMemo(
    () =>
      loadingStart
        ? messages.dateIndices.map(index => index + 1)
        : messages.dateIndices,
    [messages, loadingStart],
  );

  const onStartReached = useCallback(() => {
    if (loadingStart || range.from <= 0) return;

    setLoadingStart(true);
    setTimeout(() => {
      setRange(current => ({
        ...current,
        from: Math.max(0, current.from - PAGE_SIZE),
      }));
      setLoadingStart(false);
    }, LOAD_DELAY_MS);
  }, [loadingStart, range.from]);

  const onEndReached = useCallback(() => {
    if (loadingEnd) return;

    setLoadingEnd(true);
    setTimeout(() => {
      setRange(current => ({ ...current, to: current.to + PAGE_SIZE }));
      setLoadingEnd(false);
    }, LOAD_DELAY_MS);
  }, [loadingEnd]);

  return {
    rows,
    dateIndices,
    from: range.from,
    to: range.to,
    onStartReached,
    onEndReached,
  };
};
