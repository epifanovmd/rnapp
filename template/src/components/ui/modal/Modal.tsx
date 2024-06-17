import {
  Modal as FDModal,
  ModalProps as FDModalProps,
} from "@force-dev/react-mobile";
import React, { forwardRef, memo, PropsWithChildren } from "react";

import { useModalStyles } from "../../../common";

export interface ModalProps extends FDModalProps {}

export const Modal = memo(
  forwardRef<FDModal, PropsWithChildren<ModalProps>>((props, ref) => {
    const modalStyles = useModalStyles();

    return <FDModal ref={ref} {...modalStyles} {...props} />;
  }),
);
