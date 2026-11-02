import React, { FC } from "react";

import {
  BottomSheetBackdrop,
  IBottomSheetBackdropProps,
} from "../bottom-sheet";

/** Фон шторки, пока основное действие выполняется: тап не закрывает. */
export const ModalSheetLockedBackdrop: FC<
  IBottomSheetBackdropProps
> = props => <BottomSheetBackdrop {...props} closeOnPress={false} />;
