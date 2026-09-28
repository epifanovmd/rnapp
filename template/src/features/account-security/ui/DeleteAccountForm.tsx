import { Form, FormSubmit, TextFieldFormField } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";
import { StyleSheet } from "react-native";

import { useDeleteAccountVM } from "../model/useDeleteAccountVM";
import { TDeleteAccountForm } from "../model/validation";

export const DeleteAccountForm: FC = observer(() => {
  const { form, handleSubmit } = useDeleteAccountVM();

  return (
    <Form form={form} onSubmit={handleSubmit} style={styles.form}>
      <TextFieldFormField<TDeleteAccountForm>
        name={"password"}
        label={"Текущий пароль"}
        secureTextEntry={true}
      />
      <FormSubmit size={"small"} variant={"danger"}>
        {"Удалить аккаунт"}
      </FormSubmit>
    </Form>
  );
});

const styles = StyleSheet.create({ form: { gap: 8 } });
