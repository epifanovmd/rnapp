import React, { memo } from "react";
import { ViewProps } from "react-native";

import { CompoundRootProps, createCompound, slot } from "../../lib/slots";
import { Button, IButtonProps } from "../button";
import { FlexProps, Row } from "../flex-view";

export interface BottomSheetFooterProps extends FlexProps, ViewProps {}

const bottomSheetFooterSlots = {
  secondaryButton: slot<IButtonProps>({ component: Button }),
  primaryButton: slot<IButtonProps>({ component: Button }),
};

const BottomSheetFooterRoot = memo(
  ({
    props,
    slots,
  }: CompoundRootProps<
    BottomSheetFooterProps,
    never,
    typeof bottomSheetFooterSlots
  >) => {
    const { primaryButton, secondaryButton } = slots;

    return (
      <Row
        marginTop={"auto"}
        gap={8}
        justifyContent={"space-between"}
        {...props}
      >
        {secondaryButton.present && (
          <Button
            type={"secondaryFilled"}
            size={"small"}
            flex={1}
            flexBasis={0}
            title={"Отмена"}
            {...secondaryButton.props}
          />
        )}
        {primaryButton.present && (
          <Button
            type={"primaryFilled"}
            size={"small"}
            flex={1}
            flexBasis={0}
            marginLeft={"auto"}
            title={"Применить"}
            {...primaryButton.props}
          />
        )}
      </Row>
    );
  },
);

export const BottomSheetFooter = createCompound<
  BottomSheetFooterProps,
  never
>()({
  name: "BottomSheetFooter",
  render: BottomSheetFooterRoot,
  slots: bottomSheetFooterSlots,
});
