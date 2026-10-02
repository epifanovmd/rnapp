import { useNotifications } from "@shared/lib/notifications";
import {
  Button,
  Form,
  ModalSheet,
  ScreenScroll,
  Text,
  useZodForm,
} from "@shared/ui";
import React, { FC, memo, useCallback, useState } from "react";
import { StyleSheet } from "react-native";

import {
  KEYBOARD_DEMO_DEFAULTS,
  keyboardDemoSchema,
  TKeyboardDemoFormResult,
} from "./keyboard-demo-schema";
import { KeyboardDemoFields } from "./KeyboardDemoFields";

/**
 * Длинная форма в ModalSheet: gorhom поднимает шторку, контент шторки
 * докручивается к полю (useKeyboardAwareScroll в BottomSheet.Content).
 */
export const KeyboardSheetDemo: FC = memo(() => {
  const toast = useNotifications();
  const [open, setOpen] = useState(false);
  const form = useZodForm(keyboardDemoSchema, {
    defaultValues: KEYBOARD_DEMO_DEFAULTS,
  });
  const { isSubmitting } = form.formState;

  const resetForm = useCallback(
    () => form.reset(KEYBOARD_DEMO_DEFAULTS),
    [form],
  );

  const onSubmit = useCallback(
    (data: TKeyboardDemoFormResult) => {
      setOpen(false);
      toast.success(JSON.stringify(data, null, 2), { title: "Сохранено" });
    },
    [toast],
  );

  return (
    <ScreenScroll>
      <Text textStyle={"Body_S2"} color={"textSecondary"}>
        {
          "Шторка поднимается над клавиатурой, а форма внутри докручивается к полю. Проверь нижние поля и смену поля при открытой клавиатуре."
        }
      </Text>
      <Button title={"Открыть форму"} onPress={() => setOpen(true)} />
      <ModalSheet
        open={open}
        onOpenChange={setOpen}
        onClosed={resetForm}
        title={"Доставка"}
        description={"Профиль, адрес и заказ"}
        primaryAction={{
          title: "Сохранить",
          loading: isSubmitting,
          onPress: form.handleSubmit(onSubmit),
        }}
      >
        <Form form={form} onSubmit={onSubmit} style={styles.form}>
          <KeyboardDemoFields />
        </Form>
      </ModalSheet>
    </ScreenScroll>
  );
});

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
});
