import React from "react";
import { ViewProps } from "react-native";

import { CompoundRootProps, createCompound, slot } from "../../lib/slots";
import { Button } from "../button";
import { FlexProps, Row } from "../flex-view";

export interface BottomSheetFooterProps extends FlexProps, ViewProps {}

const bottomSheetFooterSlots = {
  secondaryButton: slot.of(Button, {
    defaultProps: {
      type: "secondaryFilled",
      size: "small",
      flex: 1,
      flexBasis: 0,
      title: "Отмена",
    },
  }),
  primaryButton: slot.of(Button, {
    defaultProps: {
      type: "primaryFilled",
      size: "small",
      flex: 1,
      flexBasis: 0,
      marginLeft: "auto",
      title: "Применить",
    },
  }),
};

const BottomSheetFooterRoot = ({
  props,
  slots,
}: CompoundRootProps<
  BottomSheetFooterProps,
  typeof bottomSheetFooterSlots
>) => {
  const { primaryButton, secondaryButton } = slots;

  return (
    <Row marginTop={"auto"} gap={8} justifyContent={"space-between"} {...props}>
      {secondaryButton.render()}
      {primaryButton.render()}
    </Row>
  );
};

export const BottomSheetFooter = createCompound<BottomSheetFooterProps>()({
  name: "BottomSheetFooter",
  render: BottomSheetFooterRoot,
  slots: bottomSheetFooterSlots,
});
