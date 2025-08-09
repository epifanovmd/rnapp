import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRef } from "react";

export const useModalRef = () => {
  return useRef<BottomSheetModal>(null);
};
