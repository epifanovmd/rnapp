import { createSlot, useSlotProps } from "@force-dev/react";
import React, { FC, memo, PropsWithChildren } from "react";
import { ColorValue } from "react-native";

import { FlexProps, Row } from "../../flexView";
import { IButtonProps, TextButton } from "../../ui";

export interface ModalActionsProps extends FlexProps {
  onReject?: () => void;
  onAccept?: () => void;
  acceptTitle?: string;
  rejectTitle?: string;
  acceptColor?: ColorValue;
  rejectColor?: ColorValue;
}

const RejectButton = createSlot<Omit<IButtonProps, "onPress">>("RejectButton");
const AcceptButton = createSlot<Omit<IButtonProps, "onPress">>("AcceptButton");

export interface ModalActionsSlots {
  RejectButton: typeof RejectButton;
  AcceptButton: typeof AcceptButton;
}

export const _ModalActions: FC<PropsWithChildren<ModalActionsProps>> = memo(
  ({
    onReject,
    onAccept,
    acceptTitle = "Применить",
    rejectTitle = "Отмена",
    acceptColor = "red",
    rejectColor = "red",
    children,
    ...rest
  }) => {
    const { rejectButton, acceptButton } = useSlotProps(
      BottomSheetActions,
      children,
    );

    return (
      <Row marginTop={"auto"} ph={8} justifyContent={"space-between"} {...rest}>
        {!!onReject && (
          <TextButton
            color={rejectColor}
            title={rejectTitle}
            {...rejectButton}
            onPress={onReject}
          />
        )}
        {!!onAccept && (
          <TextButton
            marginLeft={"auto"}
            color={acceptColor}
            title={acceptTitle}
            {...acceptButton}
            onPress={onAccept}
          />
        )}
      </Row>
    );
  },
);

export const BottomSheetActions = _ModalActions as typeof _ModalActions &
  ModalActionsSlots;

BottomSheetActions.RejectButton = RejectButton;
BottomSheetActions.AcceptButton = AcceptButton;
