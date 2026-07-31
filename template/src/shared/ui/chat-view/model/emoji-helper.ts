/**
 * Порт EmojiHelper.emojiOnlyCount: сообщение из 1–3 эмодзи без прочих символов
 * рендерится крупным шрифтом без пузыря.
 */

const EMOJI_ONLY_RE =
  /^(?:\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?(?:‍\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?)*|\p{Regional_Indicator}{2})+$/u;

const GRAPHEME_RE =
  /\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?(?:‍\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?)*|\p{Regional_Indicator}{2}/gu;

export const emojiOnlyCount = (text: string | undefined): number | null => {
  if (!text || text.length === 0) return null;
  if (!EMOJI_ONLY_RE.test(text)) return null;

  const matches = text.match(GRAPHEME_RE);

  if (!matches) return null;

  const count = matches.length;

  if (count < 1 || count > 3) return null;

  return count;
};
