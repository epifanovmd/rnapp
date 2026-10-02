import { BottomSheet, Col, Text, TextField } from "@shared/ui";
import React, { forwardRef } from "react";

/**
 * Демо работы с клавиатурой: шторка с полями ввода поднимается над
 * клавиатурой покадрово (сдвиг кита, без keyboardBehavior gorhom).
 */
export const SheetKeyboardDemo = forwardRef<BottomSheet>((_props, ref) => (
  <BottomSheet ref={ref}>
    <BottomSheet.Header label={"Клавиатура"} />
    <BottomSheet.Content>
      <Col gap={8} pb={8}>
        <Text textStyle={"Caption_M3"}>
          {"Шторка поднимается над клавиатурой вместе с ней."}
        </Text>
        <TextField label={"Введите текст"} />
        <TextField label={"Ещё одно поле"} />
      </Col>
    </BottomSheet.Content>
  </BottomSheet>
));
