import type { IModalSheetAction } from "./ModalSheet";

/**
 * Можно ли закрыть шторку отменой, крестиком, свайпом или тапом по фону:
 * пока основное действие выполняется (`loading`), закрытие заблокировано —
 * иначе результат подтверждения придёт в уже закрытую шторку.
 */
export const canDismissModalSheet = (
  primaryAction: IModalSheetAction | undefined,
): boolean => !primaryAction?.loading;
