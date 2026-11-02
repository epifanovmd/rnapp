import { Form, FormSubmit, TextFieldFormField } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";
import { StyleSheet } from "react-native";

import { useChangePasswordVM } from "../model/useChangePasswordVM";
import { TChangePasswordForm } from "../model/validation";

export const ChangePasswordForm: FC = observer(() => {
  const { form, handleSubmit } = useChangePasswordVM();

  return (
    <Form form={form} onSubmit={handleSubmit} style={styles.form}>
      <TextFieldFormField<TChangePasswordForm>
        name={"currentPassword"}
        label={"Текущий пароль"}
        secureTextEntry={true}
      />
      <TextFieldFormField<TChangePasswordForm>
        name={"newPassword"}
        label={"Новый пароль"}
        secureTextEntry={true}
      />
      <TextFieldFormField<TChangePasswordForm>
        name={"confirmPassword"}
        label={"Повторите пароль"}
        secureTextEntry={true}
      />
      <FormSubmit size={"small"}>{"Сменить пароль"}</FormSubmit>
    </Form>
  );
});

const styles = StyleSheet.create({ form: { gap: 8 } });
