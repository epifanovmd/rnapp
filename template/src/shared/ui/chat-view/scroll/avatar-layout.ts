import { IChatAvatarGroup } from "../data/chat-data";
import { IChatGeometry, rowBottom } from "./chat-geometry";

/**
 * Границы групп для sticky-аватаров.
 *
 * Аватар группы стоит у нижнего сообщения, но, пока группа на экране,
 * «прилипает» к низу видимой области и не опускается выше её первого
 * сообщения: natural → sticky → ceiling. Сама позиция считается на UI-потоке
 * от скролла (см. ChatAvatarLayer), здесь только границы групп в координатах
 * контента — они меняются редко, по данным/измерениям.
 */

export interface IStickyAvatar {
  /** Ключ группы — совпадает с ключом её первой строки. */
  key: string;
  senderName: string;
  senderAvatarUrl?: string;
  /** Верхняя граница группы (координаты контента). */
  top: number;
  /** Нижняя граница группы — низ последней строки (координаты контента). */
  bottom: number;
}

export interface IResolveStickyAvatarsInput {
  geometry: IChatGeometry;
  groups: IChatAvatarGroup[];
  avatarSize: number;
  /** Перекрытие контента сверху. */
  topInset: number;
  /** Перекрытие снизу: панель ввода и клавиатура. */
  bottomInset: number;
}

/** Запас, на который группа считается «рядом с экраном»: размер аватара + 20. */
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

    result.push({
      key: group.key,
      senderName: group.senderName,
      senderAvatarUrl: group.senderAvatarUrl,
      top: groupTop,
      bottom: groupBottom,
    });
  }

  return result;
};
