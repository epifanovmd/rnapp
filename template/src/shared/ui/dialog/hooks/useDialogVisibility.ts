import { useLatestRef } from "@shared/lib/hooks";
import { useCallback, useState } from "react";

/**
 * Видимость диалога: управляемый режим (isVisible задан снаружи) или
 * неуправляемый (собственное состояние, открытие через present).
 */
export const useDialogVisibility = (
  isVisibleProp: boolean | undefined,
  onClose?: () => void,
) => {
  const [selfVisible, setSelfVisible] = useState(false);

  const controlled = isVisibleProp !== undefined;
  const isVisible = controlled ? isVisibleProp : selfVisible;

  const controlledRef = useLatestRef(controlled);
  const onCloseRef = useLatestRef(onClose);

  const present = useCallback(() => setSelfVisible(true), []);

  /** Запрос закрытия: неуправляемый диалог закрывает себя, управляемый делегирует onClose. */
  const requestClose = useCallback(() => {
    if (!controlledRef.current) {
      setSelfVisible(false);
    }

    onCloseRef.current?.();
  }, [controlledRef, onCloseRef]);

  return { isVisible, present, requestClose };
};
