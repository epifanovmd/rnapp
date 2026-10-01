import { useNotifications } from "@shared/lib/notifications";
import {
  ActionSheet,
  Button,
  Form,
  IActionSheetItem,
  ModalSheet,
  useBottomSheetRef,
  useZodForm,
} from "@shared/ui";
import React, { FC, memo, useCallback, useState } from "react";
import { StyleSheet } from "react-native";

import {
  DEMO_FORM_DEFAULTS,
  demoFormSchema,
  TDemoFormResult,
} from "./demo-form-schema";
import { DemoFormFields } from "./DemoFormFields";

type TTemplateKey = "starter" | "business" | "reset";

const TEMPLATE_ITEMS: IActionSheetItem<TTemplateKey>[] = [
  {
    key: "starter",
    title: "Стартовый",
    description: "Free, наблюдатель, 1 место",
    icon: "rocket",
  },
  {
    key: "business",
    title: "Бизнес",
    description: "Team, администратор, 25 мест",
    icon: "briefcase",
  },
  { key: "reset", title: "Очистить форму", icon: "trash", destructive: true },
];

/**
 * Форма в ModalSheet (primaryAction, без «Отмены»). Select внутри открывает
 * свою шторку поверх формы (`nested`), ActionSheet шаблонов — тоже `nested`.
 */
export const FormSheetDemo: FC = memo(() => {
  const toast = useNotifications();
  const [open, setOpen] = useState(false);
  const templatesRef = useBottomSheetRef();
  const form = useZodForm(demoFormSchema, {
    defaultValues: DEMO_FORM_DEFAULTS,
  });
  const { isSubmitting } = form.formState;

  const onSubmit = useCallback(
    async (data: TDemoFormResult) => {
      await new Promise(resolve => setTimeout(resolve, 800));
      setOpen(false);
      form.reset(DEMO_FORM_DEFAULTS);
      toast.success(JSON.stringify(data, null, 2), { title: "Сохранено" });
    },
    [form, toast],
  );

  const applyTemplate = useCallback(
    (key: TTemplateKey) => {
      if (key === "starter") {
        form.reset({
          ...DEMO_FORM_DEFAULTS,
          name: "Стартовый",
          role: "viewer",
          seats: 1,
        });
      } else if (key === "business") {
        form.reset({
          name: "Бизнес",
          plan: "team",
          role: "admin",
          city: "Берлин",
          seats: 25,
        });
      } else {
        form.reset(DEMO_FORM_DEFAULTS);
      }
    },
    [form],
  );

  return (
    <>
      <Button title={"Форма в ModalSheet"} onPress={() => setOpen(true)} />
      <ModalSheet
        open={open}
        onOpenChange={setOpen}
        title={"Новый проект"}
        description={"Select и шаблоны открываются поверх формы"}
        cancelLabel={null}
        primaryAction={{
          title: "Сохранить",
          loading: isSubmitting,
          onPress: form.handleSubmit(onSubmit),
        }}
      >
        <Form form={form} onSubmit={onSubmit} style={styles.form}>
          <Button
            size={"small"}
            appearance={"outline"}
            leftIcon={"layers"}
            title={"Заполнить из шаблона"}
            onPress={() => templatesRef.current?.present()}
          />
          <DemoFormFields />
        </Form>
      </ModalSheet>
      <ActionSheet<TTemplateKey>
        ref={templatesRef}
        nested
        title={"Шаблон"}
        items={TEMPLATE_ITEMS}
        onSelect={applyTemplate}
      />
    </>
  );
});

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
});
