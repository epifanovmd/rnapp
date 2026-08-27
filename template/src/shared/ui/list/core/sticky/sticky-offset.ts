import type { ListStickyEdge } from "../../types";

export interface IStickyOffsetParams {
  edge: ListStickyEdge;
  /** Позиция элемента в координатах контента. */
  position: number;
  size: number;
  /** Размер вьюпорта вдоль оси скролла. */
  scrollLength: number;
  /** Текущее смещение скролла. */
  scroll: number;
  /** Отступ кромки: навбар сверху, панель ввода снизу. */
  edgeOffset: number;
  /**
   * Предел смещения: у начальной кромки — куда элемент выталкивает следующий
   * якорь, у конечной — верх собственной группы.
   */
  limit: number | undefined;
  /**
   * Высота того, что реально прилипает: у строки целиком — её высота, у
   * аватара — высота аватара. Определяет, докуда объект поднимается у конечной
   * кромки.
   */
  stickySize: number;
}

/**
 * Смещение прилипающего элемента относительно его обычной позиции.
 *
 * Worklet: считается на UI-потоке в такт скроллу.
 *
 * У начальной кромки элемент сдвигается вниз ровно настолько, насколько кромка
 * его обогнала, и упирается в следующий якорь — тот выталкивает его за кромку.
 * У конечной зеркально: поднимается, когда низ уходит ниже кромки, и не может
 * подняться выше своей группы.
 */
export const getStickyOffset = ({
  edge,
  position,
  size,
  scrollLength,
  scroll,
  edgeOffset,
  limit,
  stickySize,
}: IStickyOffsetParams): number => {
  "worklet";

  if (edge === "start") {
    const shifted = position + Math.max(0, scroll - (position - edgeOffset));
    const resolved = limit === undefined ? shifted : Math.min(shifted, limit);

    return resolved - position;
  }

  const viewportBottom = scroll + scrollLength - edgeOffset;
  const bottom = position + size;

  // Низ группы виден — объект стоит на своём месте.
  if (viewportBottom >= bottom) return 0;

  // Группа целиком ниже кромки: она ещё не доехала, двигать нечего. Без этой
  // проверки объект подтягивался бы к верху группы и всплывал на экране раньше
  // своих сообщений.
  if (limit !== undefined && viewportBottom <= limit) return 0;

  // Кромка внутри группы: прижимаем к ней, но не выше начала группы.
  const resolvedBottom =
    limit === undefined
      ? viewportBottom
      : Math.max(viewportBottom, limit + stickySize);

  return resolvedBottom - bottom;
};

/**
 * Стоит ли якорь у кромки, не выталкиваемый следующим.
 *
 * Worklet: считается на UI-потоке рядом со смещением.
 *
 * Зачем нужен: у прилипания три состояния, и покадровое движение есть только в
 * одном из них. Пока якорь не доехал до кромки, он стоит на своём месте в
 * контенте; когда его выталкивает следующий, он упирается в предел и снова
 * стоит на месте в контенте — оба раза его везёт нативный скролл, и трансформ
 * при этом постоянен. И только между ними якорь обязан компенсировать скролл
 * покадрово.
 *
 * Какую проблему решает: именно это состояние отдаётся отдельному слою поверх
 * списка, где элемент вообще не двигается. Покадровая компенсация исчезает, а
 * вместе с ней — рывки от пропущенных кадров скролла и от чужих коммитов.
 */
export const isPinnedAtEdge = ({
  edge,
  position,
  size,
  scrollLength,
  scroll,
  edgeOffset,
  limit,
  stickySize,
}: IStickyOffsetParams): boolean => {
  "worklet";

  if (edge === "start") {
    const edgePosition = scroll + edgeOffset;

    if (edgePosition <= position) return false;

    return limit === undefined || edgePosition <= limit;
  }

  const viewportBottom = scroll + scrollLength - edgeOffset;

  if (viewportBottom >= position + size) return false;

  return limit === undefined || viewportBottom > limit + stickySize;
};
