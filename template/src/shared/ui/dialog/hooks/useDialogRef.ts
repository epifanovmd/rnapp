import { useRef } from "react";

import { IDialogRef } from "../types";

/** Ref для императивного управления диалогом (аналог useBottomSheetRef). */
export const useDialogRef = () => {
  return useRef<IDialogRef>(null);
};
