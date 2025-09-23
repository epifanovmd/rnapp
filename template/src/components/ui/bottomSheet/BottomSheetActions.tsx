import { createSlot, useSlotProps } from "@force-dev/react";
import React, { FC, memo, PropsWithChildren } from "react";

import { FlexProps, Row } from "../../flexView";
import { Button, IButtonProps } from "../../ui";

export interface ModalActionsProps extends FlexProps {
  primaryTitle?: string;
  secondaryTitle?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
}

const SecondaryButton =
  createSlot<Omit<IButtonProps, "onPress">>("SecondaryButton");
const PrimaryButton =
  createSlot<Omit<IButtonProps, "onPress">>("PrimaryButton");

export interface ModalActionsSlots {
  SecondaryButton: typeof SecondaryButton;
  PrimaryButton: typeof PrimaryButton;
}

export const _ModalActions: FC<PropsWithChildren<ModalActionsProps>> = memo(
  ({
    primaryTitle = "Применить",
    secondaryTitle = "Отмена",
    onPrimary,
    onSecondary,
    children,
    ...rest
  }) => {
    const { primaryButton, secondaryButton } = useSlotProps(
      BottomSheetActions,
      children,
    );

    return (
      <Row
        marginTop={"auto"}
        gap={8}
        pa={16}
        pb={8}
        justifyContent={"space-between"}
        {...rest}
      >
        {!!onSecondary && (
          <Button
            type={"secondaryFilled"}
            size={"small"}
            flex={1}
            flexBasis={0}
            title={secondaryTitle}
            {...secondaryButton}
            onPress={onSecondary}
          />
        )}
        {!!onPrimary && (
          <Button
            type={"primaryFilled"}
            size={"small"}
            flex={1}
            flexBasis={0}
            marginLeft={"auto"}
            title={primaryTitle}
            {...primaryButton}
            onPress={onPrimary}
          />
        )}
      </Row>
    );
  },
);

export const BottomSheetActions = _ModalActions as typeof _ModalActions &
  ModalActionsSlots;

BottomSheetActions.SecondaryButton = SecondaryButton;
BottomSheetActions.PrimaryButton = PrimaryButton;
