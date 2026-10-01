/** Точка скользящего окна: время в мс — единственное обязательное поле. */
export interface ILivePoint {
  ts: number;
}

/** Границы окна; не заданная граница не ограничивает. */
export interface ILiveWindowLimits {
  /** Сколько последних точек держать. */
  maxPoints?: number;
  /** Какой отрезок времени (мс) от самой новой точки держать. */
  windowMs?: number;
}

/** Точки в границах окна: последние `windowMs` от самой новой, не больше `maxPoints`. */
export const trimLivePoints = <TPoint extends ILivePoint>(
  points: TPoint[],
  { maxPoints = Infinity, windowMs = Infinity }: ILiveWindowLimits = {},
): TPoint[] => {
  const latest = points.at(-1)?.ts ?? 0;
  const inWindow =
    windowMs === Infinity
      ? points
      : points.filter(point => point.ts > latest - windowMs);

  return maxPoints === Infinity ? inWindow : inWindow.slice(-maxPoints);
};

/**
 * Новая точка в окне; точка не новее последней (повтор, опоздавшее событие)
 * отбрасывается — возвращается прежний массив.
 */
export const pushLivePoint = <TPoint extends ILivePoint>(
  points: TPoint[],
  next: TPoint,
  limits?: ILiveWindowLimits,
): TPoint[] => {
  const last = points.at(-1);

  if (last && next.ts <= last.ts) return points;

  return trimLivePoints([...points, next], limits);
};

/**
 * История с сервера и точки, пришедшие сокетом: история — основа, из живых
 * остаются только более новые.
 */
export const mergeLivePoints = <TPoint extends ILivePoint>(
  history: TPoint[],
  live: TPoint[],
  limits?: ILiveWindowLimits,
): TPoint[] => {
  const last = history.at(-1)?.ts ?? -Infinity;

  return trimLivePoints(
    [...history, ...live.filter(point => point.ts > last)],
    limits,
  );
};
