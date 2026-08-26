/** Минимальная ширина пузыря. */
export const CHAT_BUBBLE_MIN_WIDTH = 60;

/**
 * Как контент ведёт себя по ширине пузыря.
 *
 * Пузырь не знает типов: он спрашивает у дескриптора минимальную ширину и
 * ограничивает её сверху доступной.
 */

export interface IChatContentSizingContext {
  /** Максимальная ширина пузыря — уже с учётом места под аватар. */
  maxWidth: number;
}

export type ChatContentSizing =
  /** Распирает пузырь на всю доступную ширину. Значение по умолчанию. */
  | "fill"
  /** Пузырь сжимается по содержимому. */
  | "hug"
  /** Собственная минимальная ширина: пузырь не уже её и не шире доступного. */
  | { minWidth(ctx: IChatContentSizingContext): number };

/** Минимальная ширина пузыря под контент. */
export const resolveContentMinWidth = (
  sizing: ChatContentSizing | undefined,
  ctx: IChatContentSizingContext,
): number => {
  if (sizing === "hug") return CHAT_BUBBLE_MIN_WIDTH;
  if (sizing === undefined || sizing === "fill") return ctx.maxWidth;

  return Math.min(sizing.minWidth(ctx), ctx.maxWidth);
};
