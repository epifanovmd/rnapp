import { useRef } from "react";

import { BottomSheet } from "../BottomSheet";

export const useBottomSheetRef = () => {
  return useRef<BottomSheet>(null);
};
