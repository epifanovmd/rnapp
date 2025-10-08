import { createSlot, useSlotProps } from "@force-dev/react";
import React, { FC, memo } from "react";
import { ViewProps } from "react-native";

import { FlexProps, Row } from "../../flexView";
import { Button, IButtonProps } from "../../ui";

export interface BottomSheetFooterProps extends FlexProps, ViewProps {
  primaryTitle?: string;
  secondaryTitle?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
}

const SecondaryButton =
  createSlot<Omit<IButtonProps, "onPress">>("SecondaryButton");
const PrimaryButton =
  createSlot<Omit<IButtonProps, "onPress">>("PrimaryButton");

export const _BottomSheetFooter: FC<BottomSheetFooterProps> = memo(
  ({
    primaryTitle = "Применить",
    secondaryTitle = "Отмена",
    onPrimary,
    onSecondary,
    children,
    ...rest
  }) => {
    const { primaryButton, secondaryButton } = useSlotProps(
      BottomSheetFooter,
      children,
    );

    return (
      <Row
        marginTop={"auto"}
        gap={8}
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

export const BottomSheetFooter = Object.assign(_BottomSheetFooter, {
  SecondaryButton,
  PrimaryButton,
});
