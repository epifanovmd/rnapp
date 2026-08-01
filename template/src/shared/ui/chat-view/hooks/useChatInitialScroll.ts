import { useCallback, useMemo, useRef } from "react";

import { IChatScrollAnchor } from "../types";
import { IChatData } from "./useChatData";
import { IChatScrollController } from "./useChatScroll";

/**
 * Начальная позиция — порт `executePendingInitialScroll()`.
 *
 * Эталон откладывает первый скролл до момента, когда вьюха реально
 * отлейаутилась, и только потом снимает `isInitialScrollProtected`. Здесь
 * ту же роль играет декларативный `initialScrollIndex` списка плюс
 * `onLoad`: список сам ставит стартовую позицию до первого кадра, а мы
 * лишь снимаем защиту, когда он отчитался о готовности.
 *
 * Это заметно надёжнее императивного «скроллнуть в `useEffect`»: не бывает
 * кадра со списком в неправильной позиции.
 */

export interface IChatInitialScrollOptions {
  anchor: IChatScrollAnchor | undefined;
  data: React.RefObject<IChatData>;
  scroll: IChatScrollController;
  /** Снять начальную защиту и досчитать зависимые оверлеи. */
  onReady: () => void;
}

export interface IChatInitialScroll {
  /**
   * Значение `initialScrollIndex` для списка: индекс строки-якоря с
   * `viewPosition: 1` (нижний край строки у низа вьюпорта) и сдвигом
   * на сохранённый offset. Порт `restoreScrollAnchor` на старте.
   */
  initialScrollIndex:
    { index: number; viewPosition: number; viewOffset: number } | undefined;
  /** Начинать ли с конца списка. Порт `pendingInitialScroll = .toBottom`. */
  initialScrollAtEnd: boolean;
  /** Обработчик `onLoad` списка. */
  onLoad: () => void;
}

export const useChatInitialScroll = ({
  anchor,
  data,
  scroll,
  onReady,
}: IChatInitialScrollOptions): IChatInitialScroll => {
  // Якорь берётся ровно один раз — на монтировании. Дальнейшие изменения
  // пропа не должны дёргать позицию: ей уже управляет пользователь.
  const initialAnchorRef = useRef(anchor);

  const initialScrollIndex = useMemo(() => {
    const initial = initialAnchorRef.current;

    if (!initial || initial.wasAtBottom) return undefined;

    const index = data.current.rowIndexById.get(initial.messageId);

    if (index == null) return undefined;

    // Восстановление якоря — выравнивание по низу (viewPosition 1), как в
    // эталоне: `contentOffset.y = cellBottom + offset - bounds.height`.
    return {
      index,
      viewPosition: 1,
      viewOffset: -initial.offset,
    };
    // Только первый рендер: строки последующих обновлений здесь не нужны.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onLoad = useCallback(() => {
    scroll.state.current.isInitialScrollProtected = false;
    onReady();
  }, [scroll, onReady]);

  return useMemo(
    () => ({
      initialScrollIndex,
      initialScrollAtEnd: initialScrollIndex == null,
      onLoad,
    }),
    [initialScrollIndex, onLoad],
  );
};
