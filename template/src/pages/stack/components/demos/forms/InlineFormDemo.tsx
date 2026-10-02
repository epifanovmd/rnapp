import { useNotifications } from "@shared/lib/notifications";
import { Form, FormSubmit, useZodForm } from "@shared/ui";
import React, { FC, memo, useCallback } from "react";
import { StyleSheet } from "react-native";

import {
  DEMO_FORM_DEFAULTS,
  demoFormSchema,
  TDemoFormResult,
} from "./demo-form-schema";
import { DemoFormFields } from "./DemoFormFields";

/** Форма на useZodForm + Form: отправка показывает тост с результатом. */
export const InlineFormDemo: FC = memo(() => {
  const toast = useNotifications();
  const form = useZodForm(demoFormSchema, {
    defaultValues: DEMO_FORM_DEFAULTS,
  });

  const onSubmit = useCallback(
    (data: TDemoFormResult) => {
      toast.success(JSON.stringify(data, null, 2), { title: "Отправлено" });
    },
    [toast],
  );

  return (
    <Form form={form} onSubmit={onSubmit} style={styles.form}>
      <DemoFormFields />
      <FormSubmit title={"Отправить"} />
    </Form>
  );
});

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
});
