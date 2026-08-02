import { IChatAvatarGroup } from "../data/chat-data";
import { IChatGeometry, rowBottom } from "./chat-geometry";

/**
 * Позиции sticky-аватаров — порт `ChatCollectionViewLayout.avatarAttributes`.
 *
 * Аватар группы стоит у нижнего сообщения, но, пока группа на экране,
 * «прилипает» к низу видимой области и не опускается выше её первого
 * сообщения: natural → sticky → ceiling.
 */

export interface IStickyAvatar {
  /** Ключ группы — совпадает с ключом её первой строки. */
  key: string;
  senderName: string;
  senderAvatarUrl?: string;
  /** Позиция от верха видимой области списка (px). */
  y: number;
}

export interface IResolveStickyAvatarsInput {
  geometry: IChatGeometry;
  groups: IChatAvatarGroup[];
  avatarSize: number;
  /** Перекрытие контента сверху (порт `adjustedContentInset.top`). */
  topInset: number;
  /** Перекрытие снизу: панель ввода и клавиатура. */
  bottomInset: number;
}

/** Запас, на который группа считается «рядом с экраном». Порт `avatarSize + 20`. */
const CULL_MARGIN = 20;

export const resolveStickyAvatars = ({
  geometry,
  groups,
  avatarSize,
  topInset,
  bottomInset,
}: IResolveStickyAvatarsInput): IStickyAvatar[] => {
  if (groups.length === 0 || geometry.viewportHeight <= 0) return [];

  const visibleTop = geometry.scrollY + topInset;
  const visibleBottom =
    geometry.scrollY + geometry.viewportHeight - bottomInset;
  const margin = avatarSize + CULL_MARGIN;

  const result: IStickyAvatar[] = [];

  for (const group of groups) {
    const groupTop = geometry.rowTop(group.firstIndex);
    const groupBottom = rowBottom(geometry, group.lastIndex);

    if (groupTop == null || groupBottom == null) continue;
    if (groupBottom + margin < visibleTop) continue;
    if (groupTop - margin > visibleBottom) break;

    const sticky = Math.min(
      groupBottom - avatarSize,
      visibleBottom - avatarSize,
    );

    result.push({
      key: group.key,
      senderName: group.senderName,
      senderAvatarUrl: group.senderAvatarUrl,
      y: Math.max(sticky, groupTop) - geometry.scrollY,
    });
  }

  return result;
};
