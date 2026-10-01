import { useEvent } from "@shared/lib/hooks";
import { useEffect, useRef } from "react";

import { useBottomSheetRef } from "../../bottom-sheet";

/**
 * Показ шторки по флагу `visible`. `onUserDismiss` — шторку закрыли жестом,
 * фоном или крестиком, пока она должна была быть видна; программное
 * скрытие (`visible` → false) его не вызывает.
 */
export const useSelectSheet = (visible: boolean, onUserDismiss: () => void) => {
  const sheetRef = useBottomSheetRef();
  const presentedRef = useRef(false);
  const visibleRef = useRef(visible);

  visibleRef.current = visible;

  // dismiss() ни разу не показанной шторки переводит её в «закрывается»,
  // и следующий present() её уже не открывает — закрываем только показанную.
  useEffect(() => {
    if (visible) {
      presentedRef.current = true;
      sheetRef.current?.present();
    } else if (presentedRef.current) {
      presentedRef.current = false;
      sheetRef.current?.dismiss();
    }
  }, [visible, sheetRef]);

  const onDismiss = useEvent(() => {
    presentedRef.current = false;
    if (visibleRef.current) onUserDismiss();
  });

  return { sheetRef, onDismiss };
};
