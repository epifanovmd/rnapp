import { IChatScrollAnchor } from "../types";
import { IChatGeometry, isNearBottom, rowBottom } from "./chat-geometry";
import { ChatRow } from "./chat-rows";

/**
 * Якорь скролла — порт `ScrollAnchor` и семейства методов
 * `currentScrollAnchor` / `currentVisibleAnchors` / `restoreScrollAnchor` /
 * `restoreBestAnchor` из `ChatViewController`.
 *
 * Идея эталона: привязываться не к индексу (он плывёт при вставках сверху),
 * а к **нижнему видимому сообщению** и расстоянию от него до низа вьюпорта.
 * Такой якорь переживает любые изменения выше по списку.
 *
 * Все функции здесь чистые: на входе геометрия и строки, на выходе — числа.
 * Ни таймеров, ни ссылок на список.
 */

/** Расстояние от низа вьюпорта до нижнего края строки. */
const offsetFromVisibleBottom = (
  geometry: IChatGeometry,
  index: number,
): number | undefined => {
  const bottom = rowBottom(geometry, index);

  if (bottom == null) return undefined;

  return geometry.scrollY + geometry.viewportHeight - bottom;
};

/**
 * Текущая позиция как стабильный якорь. Порт `currentScrollAnchor()`.
 *
 * Внизу чата возвращаем `wasAtBottom` — точную позицию восстанавливать
 * не нужно, достаточно снова прижаться к концу.
 */
export const computeScrollAnchor = (
  geometry: IChatGeometry,
  rows: ChatRow[],
  lastMessageId: string | undefined,
  scrollToBottomThreshold: number,
): IChatScrollAnchor | null => {
  if (!lastMessageId) return null;

  if (isNearBottom(geometry, scrollToBottomThreshold)) {
    return { messageId: lastMessageId, offset: 0, wasAtBottom: true };
  }

  const { start, end } = geometry.visibleRange;

  for (let i = end; i >= start; i--) {
    const row = rows[i];

    if (!row || row.type !== "message") continue;

    const offset = offsetFromVisibleBottom(geometry, i);

    if (offset == null) continue;

    return { messageId: row.message.id, offset, wasAtBottom: false };
  }

  return null;
};

/**
 * Все видимые якоря сверху вниз. Порт `currentVisibleAnchors()`.
 *
 * Нужны там, где часть сообщений может исчезнуть при обновлении: после
 * применения данных выбираем тот якорь, который ещё существует.
 */
export const computeVisibleAnchors = (
  geometry: IChatGeometry,
  rows: ChatRow[],
  lastMessageId: string | undefined,
  scrollToBottomThreshold: number,
): IChatScrollAnchor[] => {
  if (!lastMessageId) return [];

  if (isNearBottom(geometry, scrollToBottomThreshold)) {
    return [{ messageId: lastMessageId, offset: 0, wasAtBottom: true }];
  }

  const { start, end } = geometry.visibleRange;
  const anchors: IChatScrollAnchor[] = [];

  for (let i = start; i <= end; i++) {
    const row = rows[i];

    if (!row || row.type !== "message") continue;

    const offset = offsetFromVisibleBottom(geometry, i);

    if (offset == null) continue;

    anchors.push({ messageId: row.message.id, offset, wasAtBottom: false });
  }

  return anchors;
};

/** Границы допустимой позиции скролла. */
const clampOffset = (geometry: IChatGeometry, target: number): number => {
  const maxY = Math.max(0, geometry.contentHeight - geometry.viewportHeight);

  return Math.min(Math.max(target, 0), maxY);
};

/**
 * Позиция скролла, при которой якорь снова окажется на прежнем месте.
 * Порт `restoreScrollAnchor()` (без самого скролла — только математика).
 *
 * `contentOffset.y = cellBottom + offset - bounds.height`
 */
export const resolveAnchorOffset = (
  geometry: IChatGeometry,
  anchor: IChatScrollAnchor,
  rowIndexById: Map<string, number>,
): number | null => {
  const index = rowIndexById.get(anchor.messageId);

  if (index == null) return null;

  const bottom = rowBottom(geometry, index);

  if (bottom == null) return null;

  return clampOffset(
    geometry,
    bottom + anchor.offset - geometry.viewportHeight,
  );
};

/**
 * Лучший из якорей: существует в новом списке и смещает скролл минимально.
 * Порт `restoreBestAnchor()`.
 */
export const resolveBestAnchorOffset = (
  geometry: IChatGeometry,
  anchors: IChatScrollAnchor[],
  rowIndexById: Map<string, number>,
  fallbackOffset: number,
): number | null => {
  let bestTarget: number | null = null;
  let bestDelta = Number.POSITIVE_INFINITY;

  for (const anchor of anchors) {
    const target = resolveAnchorOffset(geometry, anchor, rowIndexById);

    if (target == null) continue;

    const delta = Math.abs(target - fallbackOffset);

    if (delta < bestDelta) {
      bestDelta = delta;
      bestTarget = target;
    }
  }

  return bestTarget;
};
