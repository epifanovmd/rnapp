import { Form, FormSubmit, TextFieldFormField } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";
import { StyleSheet } from "react-native";

import { useUsernameVM } from "../model/useUsernameVM";
import { TUsernameForm } from "../model/validation";

export const UsernameForm: FC = observer(() => {
  const { form, handleSubmit } = useUsernameVM();

  return (
    <Form form={form} onSubmit={handleSubmit} style={styles.form}>
      <TextFieldFormField<TUsernameForm>
        name={"username"}
        label={"Username"}
        autoCapitalize={"none"}
        autoCorrect={false}
      />
      <FormSubmit size={"small"}>{"Сохранить username"}</FormSubmit>
    </Form>
  );
});

const styles = StyleSheet.create({ form: { gap: 8 } });
