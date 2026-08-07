import React, { useCallback } from "react";
import { StyleSheet, TouchableOpacity, ViewProps } from "react-native";

import { CompoundRootProps, createCompound, slot } from "../../lib/slots";
import { BalancedRow } from "../balanced-row";
import { FlexProps, Row } from "../flex-view";
import { Icon, IIconProps } from "../icon";
import { Text } from "../text";
import { useDialogContext } from "./dialog-context";

const hitSlop = { top: 24, right: 24, bottom: 24, left: 24 };

export interface DialogHeaderProps extends FlexProps, ViewProps {
  /** Заголовок строго по центру: слева резервируется ширина правой области. */
  centered?: boolean;
  label?: string;
  /** По умолчанию закрывает диалог, в котором находится шапка. */
  onClose?: () => void;
}

const dialogHeaderSlots = {
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

const DialogHeaderRoot = ({
  props,
  slots,
  content,
  hasContent,
}: CompoundRootProps<DialogHeaderProps, typeof dialogHeaderSlots>) => {
  const { centered, label, onClose, style, ...rest } = props;
  const { closeButton, closeIcon, title } = slots;
  const dialog = useDialogContext();

  const onPress = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      dialog?.close();
    }
  }, [dialog, onClose]);

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

export const DialogHeader = createCompound<DialogHeaderProps>()({
  name: "DialogHeader",
  render: DialogHeaderRoot,
  slots: dialogHeaderSlots,
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
