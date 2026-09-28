import {
  Col,
  Form,
  FormSubmit,
  RadioGroup,
  TextFieldFormField,
} from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";
import { StyleSheet } from "react-native";

import { TTwoFactorMode, useTwoFactorVM } from "../model/useTwoFactorVM";
import { TDisable2FAForm, TEnable2FAForm } from "../model/validation";

const MODE_OPTIONS: { label: string; value: TTwoFactorMode }[] = [
  { label: "Включить", value: "enable" },
  { label: "Выключить", value: "disable" },
];

export const TwoFactorForm: FC = observer(() => {
  const { mode, setMode, enableForm, disableForm, enable, disable } =
    useTwoFactorVM();

  return (
    <Col gap={12}>
      <RadioGroup
        horizontal={true}
        options={MODE_OPTIONS}
        value={mode}
        onChange={setMode}
      />

      {mode === "enable" ? (
        <Form form={enableForm} onSubmit={enable} style={styles.form}>
          <TextFieldFormField<TEnable2FAForm>
            name={"currentPassword"}
            label={"Текущий пароль"}
            secureTextEntry={true}
          />
          <TextFieldFormField<TEnable2FAForm>
            name={"password"}
            label={"Пароль второго фактора"}
            secureTextEntry={true}
          />
          <TextFieldFormField<TEnable2FAForm>
            name={"hint"}
            label={"Подсказка (необязательно)"}
          />
          <FormSubmit size={"small"}>{"Включить 2FA"}</FormSubmit>
        </Form>
      ) : (
        <Form form={disableForm} onSubmit={disable} style={styles.form}>
          <TextFieldFormField<TDisable2FAForm>
            name={"currentPassword"}
            label={"Текущий пароль"}
            secureTextEntry={true}
          />
          <TextFieldFormField<TDisable2FAForm>
            name={"password"}
            label={"Пароль второго фактора"}
            secureTextEntry={true}
          />
          <FormSubmit size={"small"} variant={"danger"}>
            {"Выключить 2FA"}
          </FormSubmit>
        </Form>
      )}
    </Col>
  );
});

const styles = StyleSheet.create({ form: { gap: 8 } });
