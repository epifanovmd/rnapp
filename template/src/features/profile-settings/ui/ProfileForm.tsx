import { Form, FormSubmit, TextFieldFormField } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";
import { StyleSheet } from "react-native";

import { useProfileFormVM } from "../model/useProfileFormVM";
import { TProfileForm } from "../model/validation";

export const ProfileForm: FC = observer(() => {
  const { form, handleSubmit } = useProfileFormVM();

  return (
    <Form form={form} onSubmit={handleSubmit} style={styles.form}>
      <TextFieldFormField<TProfileForm> name={"firstName"} label={"Имя"} />
      <TextFieldFormField<TProfileForm> name={"lastName"} label={"Фамилия"} />
      <TextFieldFormField<TProfileForm>
        name={"birthDate"}
        label={"Дата рождения (ГГГГ-ММ-ДД)"}
        keyboardType={"numbers-and-punctuation"}
      />
      <TextFieldFormField<TProfileForm> name={"gender"} label={"Пол"} />
      <TextFieldFormField<TProfileForm>
        name={"locale"}
        label={"Язык (ru, en)"}
        autoCapitalize={"none"}
      />
      <FormSubmit size={"small"}>{"Сохранить"}</FormSubmit>
    </Form>
  );
});

const styles = StyleSheet.create({ form: { gap: 8 } });
