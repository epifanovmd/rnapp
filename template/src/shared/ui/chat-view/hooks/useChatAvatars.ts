import { useCallback, useEffect } from "react";

import { ChatAvatarStore } from "../components/chat-avatar-store";
import { IChatAvatarGroup } from "../data";
import { IChatGeometry, resolveStickyAvatars } from "../scroll";

/**
 * Пересчёт позиций sticky-аватаров на каждом кадре скролла — порт
 * `shouldInvalidateLayout(forBoundsChange:)` для аватар-слоя.
 *
 * Возвращает функцию пересчёта: её зовёт обработчик скролла вместе с плавающей
 * датой и видимостью. Результат пишется в стор аватаров, React при этом
 * трогается только когда меняется состав групп на экране.
 */

export interface IChatAvatarsOptions {
  store: ChatAvatarStore;
  readGeometry: () => IChatGeometry;
  getGroups: () => IChatAvatarGroup[];
  isEnabled: () => boolean;
  getAvatarSize: () => number;
  getTopInset: () => number;
  getBottomInset: () => number;
}

export const useChatAvatars = ({
  store,
  readGeometry,
  getGroups,
  isEnabled,
  getAvatarSize,
  getTopInset,
  getBottomInset,
}: IChatAvatarsOptions) => {
  useEffect(() => () => store.clear(), [store]);

  return useCallback(() => {
    if (!isEnabled()) {
      store.clear();

      return;
    }

    store.sync(
      resolveStickyAvatars({
        geometry: readGeometry(),
        groups: getGroups(),
        avatarSize: getAvatarSize(),
        topInset: getTopInset(),
        bottomInset: getBottomInset(),
      }),
    );
  }, [
    store,
    readGeometry,
    getGroups,
    isEnabled,
    getAvatarSize,
    getTopInset,
    getBottomInset,
  ]);
};
