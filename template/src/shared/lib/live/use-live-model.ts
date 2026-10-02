import { useLatestRef } from "@shared/lib/hooks";
import { useSocketEvent } from "@shared/lib/socket";
import { observable, runInAction } from "mobx";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  type ILivePoint,
  type ILiveWindowLimits,
  mergeLivePoints,
  pushLivePoint,
} from "./live-window";

/** Ответ загрузчика в форме API-клиента (`{ data, error }`). */
export interface ILiveLoadResult<T> {
  data?: T | null;
}

/** Скользящее окно точек, которое модель копит из снимков. */
export interface ILiveWindowOptions<TSnapshot, TPoint extends ILivePoint>
  extends ILiveWindowLimits {
  /** Точка окна из снимка сокета. */
  toPoint: (snapshot: TSnapshot) => TPoint;
  /** История окна с сервера — при открытии и по `reload`. */
  load?: (id: string) => Promise<ILiveLoadResult<TPoint[]>>;
}

export interface IUseLiveModelOptions<
  TSnapshot,
  TPayload = TSnapshot,
  TPoint extends ILivePoint = never,
> {
  /** Чьи данные; `null` — не загружать и не слушать. */
  id: string | null;
  /** Событие сокета со снимком (или пачкой снимков). */
  event: string;
  /**
   * Снимок `id` из события; `null`/`undefined` — событие не о нём.
   * По умолчанию событие и есть снимок.
   */
  select?: (payload: TPayload, id: string) => TSnapshot | null | undefined;
  /** Текущий снимок с сервера — при открытии и по `reload`. */
  load: (id: string) => Promise<ILiveLoadResult<TSnapshot>>;
  /** Скользящее окно точек (график); без него `points` всегда пуст. */
  window?: ILiveWindowOptions<TSnapshot, TPoint>;
  /**
   * Слушать события (например, `useIsFocused()`): выключено — тики не
   * обрабатываются (скрытый экран не тратит JS и не перерисовывается),
   * включение — перечитывание пропущенного. По умолчанию `true`.
   */
  enabled?: boolean;
}

/**
 * Живые данные: MobX-поля на стабильном объекте. Тик сокета перерисовывает
 * только observer-компоненты, читающие `live`/`points`, а не держателя модели.
 */
export interface ILiveModel<TSnapshot, TPoint extends ILivePoint = never> {
  /** Последний снимок текущего `id`. */
  readonly live: TSnapshot | null;
  /** Окно точек текущего `id` (пусто без `window`). */
  readonly points: TPoint[];
  /** Перезагрузить снимок и историю окна. */
  reload: () => Promise<void>;
}

interface ILiveState<TSnapshot, TPoint> {
  id: string | null;
  live: TSnapshot | null;
  points: TPoint[];
}

const selectPayload = <TSnapshot>(payload: unknown) => payload as TSnapshot;

/**
 * Живые данные сокета в MobX-модели со стабильным объектом: снимок (и история
 * окна) при открытии, дальше — события сокета. Состояние принадлежит `id`:
 * при его смене прежние данные не показываются.
 *
 * VM отдаёт модель целиком, читает её observer-лист:
 * @example
 * const metrics = useLiveModel<IDeviceLive, { devices: IDeviceLive[] }, IMetricPoint>({
 *   id: deviceId,
 *   event: "devices:stats",
 *   select: ({ devices }, id) => devices.find(device => device.deviceId === id),
 *   load: id => api.currentDeviceStats(id),
 *   window: {
 *     toPoint: s => ({ ts: Date.parse(s.ts), cpu: s.cpu, memory: s.memory }),
 *     load: id => api.deviceStatsWindow(id),
 *     maxPoints: 600,
 *     windowMs: 10 * 60_000,
 *   },
 * });
 *
 * const MetricsChart = observer(({ metrics }: { metrics: ILiveModel<IDeviceLive, IMetricPoint> }) =>
 *   <Chart points={metrics.points} />);
 */
export const useLiveModel = <
  TSnapshot,
  TPayload = TSnapshot,
  TPoint extends ILivePoint = never,
>({
  id,
  event,
  select = selectPayload<TSnapshot>,
  load,
  window,
  enabled = true,
}: IUseLiveModelOptions<TSnapshot, TPayload, TPoint>): ILiveModel<
  TSnapshot,
  TPoint
> => {
  const [state] = useState(() =>
    observable<ILiveState<TSnapshot, TPoint>>(
      { id, live: null, points: [] },
      { live: observable.ref, points: observable.ref },
    ),
  );
  const loadRef = useLatestRef(load);
  const windowRef = useLatestRef(window);

  const reload = useCallback(async () => {
    if (!id) return;

    const windowOptions = windowRef.current;
    const [{ data }, history] = await Promise.all([
      loadRef.current(id),
      windowOptions?.load ? windowOptions.load(id) : undefined,
    ]);
    const historyPoints = history?.data;

    if (!data && !historyPoints) return;

    runInAction(() => {
      const own = state.id === id;
      const points = own ? state.points : [];

      state.live = data ?? (own ? state.live : null);
      state.points = historyPoints
        ? mergeLivePoints(historyPoints, points, windowOptions)
        : points;
      state.id = id;
    });
  }, [id, loadRef, windowRef, state]);

  // Открытие и возвращение к слушанию: события за паузу потеряны.
  useEffect(() => {
    if (enabled) reload();
  }, [reload, enabled]);

  useSocketEvent<[TPayload]>(
    event,
    payload => {
      const snapshot = id ? select(payload, id) : null;

      if (!id || !snapshot) return;

      const windowOptions = windowRef.current;

      runInAction(() => {
        const points = state.id === id ? state.points : [];

        state.points = windowOptions
          ? pushLivePoint(points, windowOptions.toPoint(snapshot), windowOptions)
          : points;
        state.live = snapshot;
        state.id = id;
      });
    },
    id !== null && enabled,
  );

  return useMemo<ILiveModel<TSnapshot, TPoint>>(
    () => ({
      get live() {
        return state.id === id ? state.live : null;
      },
      get points() {
        return state.id === id ? state.points : [];
      },
      reload,
    }),
    [id, reload, state],
  );
};
