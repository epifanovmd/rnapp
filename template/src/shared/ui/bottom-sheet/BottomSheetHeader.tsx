import { useBottomSheet } from "@gorhom/bottom-sheet";
import React, { useCallback } from "react";
import { StyleSheet, TouchableOpacity, ViewProps } from "react-native";

import { CompoundRootProps, createCompound, slot } from "../../lib/slots";
import { BalancedRow } from "../balanced-row";
import { FlexProps, Row } from "../flex-view";
import { Icon, IIconProps } from "../icon";
import { Text } from "../text";

const hitSlop = { top: 24, right: 24, bottom: 24, left: 24 };

export interface BottomSheetHeaderProps extends FlexProps, ViewProps {
  /** Заголовок строго по центру: слева резервируется ширина правой области. */
  centered?: boolean;
  label?: string;
  /** По умолчанию закрывает лист, в котором находится шапка. */
  onClose?: () => void;
}

const bottomSheetHeaderSlots = {
  title: slot.of(Text, {
    always: true,
    defaultProps: { textStyle: "Title_L" },
  }),
  closeButton: slot.of(TouchableOpacity, {
    always: true,
    defaultProps: { hitSlop },
  }),
  // Partial: `name` приходит из defaultProps, снаружи его указывать не нужно.
  closeIcon: slot<Partial<IIconProps>>({
    always: true,
    component: Icon,
    defaultProps: { name: "closeCircle" },
  }),
};

const BottomSheetHeaderRoot = ({
  props,
  slots,
  content,
  hasContent,
}: CompoundRootProps<
  BottomSheetHeaderProps,
  typeof bottomSheetHeaderSlots
>) => {
  const { centered, label, onClose, style, ...rest } = props;
  const { closeButton, closeIcon, title } = slots;
  const { close: closeSheet } = useBottomSheet();

  // Без аргументов: обработчик нажатия не должен утечь в animationConfigs.
  const onPress = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      closeSheet();
    }
  }, [closeSheet, onClose]);

  const heading = hasContent
    ? content
    : title.render({ defaults: { text: label } });

  const close = closeButton.render({
    defaults: { children: closeIcon.render() },
    inject: { onPress, style: centered ? undefined : SS.push },
  });

  return centered ? (
    <BalancedRow style={[SS.container, style]} rightContent={close} {...rest}>
      {heading}
    </BalancedRow>
  ) : (
    <Row style={[SS.container, style]} {...rest}>
      {heading}
      {close}
    </Row>
  );
};

export const BottomSheetHeader = createCompound<BottomSheetHeaderProps>()({
  name: "BottomSheetHeader",
  render: BottomSheetHeaderRoot,
  slots: bottomSheetHeaderSlots,
});

const SS = StyleSheet.create({
  container: {
    minHeight: 24,
    alignItems: "center",
  },
  push: {
    marginLeft: "auto",
  },
});
