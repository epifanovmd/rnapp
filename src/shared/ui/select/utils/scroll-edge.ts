/** Запас до конца списка, при котором стартует догрузка, px. */
export const LOAD_MORE_THRESHOLD = 96;

export interface ScrollEdgeMetrics {
  /** Смещение скролла. */
  offset: number;
  /** Высота видимой области. */
  viewport: number;
  /** Высота контента. */
  content: number;
}

/**
 * Конец списка близко: до нижней кромки контента осталось меньше `threshold`.
 * Короткий контент, который целиком влезает во вьюпорт, тоже считается концом —
 * иначе догрузка не стартует, пока скроллить нечего.
 */
export const isNearScrollEnd = (
  { offset, viewport, content }: ScrollEdgeMetrics,
  threshold = LOAD_MORE_THRESHOLD,
): boolean => viewport > 0 && content - (offset + viewport) <= threshold;
