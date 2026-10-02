import { useNotifications } from "@shared/lib/notifications";
import { Form, FormSubmit, ScreenScroll, Text, useZodForm } from "@shared/ui";
import React, { FC, memo, useCallback } from "react";
import { StyleSheet } from "react-native";

import {
  KEYBOARD_DEMO_DEFAULTS,
  keyboardDemoSchema,
  TKeyboardDemoFormResult,
} from "./keyboard-demo-schema";
import { KeyboardDemoFields } from "./KeyboardDemoFields";

/**
 * Длинная форма в ScreenScroll (useKeyboardAwareScroll): поле целиком над
 * клавиатурой, ошибка на blur, multiline внизу.
 */
export const KeyboardScrollDemo: FC = memo(() => {
  const toast = useNotifications();
  const form = useZodForm(keyboardDemoSchema, {
    defaultValues: KEYBOARD_DEMO_DEFAULTS,
  });

  const onSubmit = useCallback(
    (data: TKeyboardDemoFormResult) => {
      toast.success(JSON.stringify(data, null, 2), { title: "Отправлено" });
    },
    [toast],
  );

  return (
    <ScreenScroll gap={16}>
      <Text textStyle={"Body_S2"} color={"textSecondary"}>
        {
          "Фокус на любом поле поднимает его над клавиатурой целиком — с описанием и ошибкой. Ошибка появляется при уходе с поля."
        }
      </Text>
      <Form form={form} onSubmit={onSubmit} style={styles.form}>
        <KeyboardDemoFields />
        <FormSubmit title={"Отправить"} />
      </Form>
    </ScreenScroll>
  );
});

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
});
