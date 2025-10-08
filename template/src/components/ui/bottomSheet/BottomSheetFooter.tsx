import { createSlot, useSlotProps } from "@force-dev/react";
import React, { FC, memo } from "react";
import { ViewProps } from "react-native";

import { FlexProps, Row } from "../../flexView";
import { Button, IButtonProps } from "../../ui";

export interface BottomSheetFooterProps extends FlexProps, ViewProps {}

const SecondaryButton = createSlot<IButtonProps>("SecondaryButton");
const PrimaryButton = createSlot<IButtonProps>("PrimaryButton");

export const _BottomSheetFooter: FC<BottomSheetFooterProps> = memo(
  ({ children, ...rest }) => {
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
        {!!secondaryButton && (
          <Button
            type={"secondaryFilled"}
            size={"small"}
            flex={1}
            flexBasis={0}
            title={"Отмена"}
            {...secondaryButton}
          />
        )}
        {!!primaryButton && (
          <Button
            type={"primaryFilled"}
            size={"small"}
            flex={1}
            flexBasis={0}
            marginLeft={"auto"}
            title={"Применить"}
            {...primaryButton}
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
