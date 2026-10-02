import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { useTheme } from "@shared/lib/theme";
import { BottomSheet, Col, Text } from "@shared/ui";
import React, { forwardRef, useMemo } from "react";
import { StyleSheet, TextStyle } from "react-native";

/**
 * Демо работы с клавиатурой: контент содержит поле ввода, чтобы показать
 * keyboardBehavior/keyboardBlurBehavior листа.
 */
export const SheetKeyboardDemo = forwardRef<BottomSheet>((_props, ref) => {
  const { colors } = useTheme();

  const inputStyle = useMemo<TextStyle>(
    () => ({
      borderColor: colors.border,
      color: colors.textPrimary,
      backgroundColor: colors.background,
    }),
    [colors],
  );

  return (
    <BottomSheet
      ref={ref}
      keyboardBehavior={"interactive"}
      keyboardBlurBehavior={"restore"}
    >
      <BottomSheet.Header label={"Клавиатура"} />
      <BottomSheet.Content>
        <Col gap={8} pb={8}>
          <Text textStyle={"Caption_M3"}>
            {
              "keyboardBehavior: interactive — лист подстраивается под клавиатуру."
            }
          </Text>
          <BottomSheetTextInput
            placeholder={"Введите текст"}
            placeholderTextColor={colors.textSecondary}
            style={[SS.input, inputStyle]}
          />
          <BottomSheetTextInput
            placeholder={"Ещё одно поле"}
            placeholderTextColor={colors.textSecondary}
            style={[SS.input, inputStyle]}
          />
        </Col>
      </BottomSheet.Content>
    </BottomSheet>
  );
});

const SS = StyleSheet.create({
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
});
