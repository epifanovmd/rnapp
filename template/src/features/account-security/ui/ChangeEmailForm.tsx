import {
  Button,
  Col,
  Form,
  FormSubmit,
  Text,
  TextFieldFormField,
} from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";
import { StyleSheet } from "react-native";

import { useChangeEmailVM } from "../model/useChangeEmailVM";
import { useVerifyEmailVM } from "../model/useVerifyEmailVM";
import { TCodeForm, TEmailForm } from "../model/validation";

/** Подтверждение текущего адреса, если он ещё не подтверждён. */
const VerifyCurrentEmail: FC = observer(() => {
  const {
    needsVerification,
    isCodeSent,
    isRequesting,
    form,
    requestCode,
    verify,
  } = useVerifyEmailVM();

  if (!needsVerification) return null;

  return (
    <Col gap={8}>
      <Text textStyle={"Body_S2"} color={"warning"}>
        {"Email не подтверждён."}
      </Text>
      {isCodeSent ? (
        <Form form={form} onSubmit={verify} style={styles.form}>
          <TextFieldFormField<TCodeForm>
            name={"code"}
            label={"Код из письма"}
            keyboardType={"number-pad"}
          />
          <FormSubmit size={"small"}>{"Подтвердить email"}</FormSubmit>
        </Form>
      ) : (
        <Button
          size={"small"}
          appearance={"outline"}
          loading={isRequesting}
          onPress={requestCode}
        >
          {"Отправить код подтверждения"}
        </Button>
      )}
    </Col>
  );
});

export const ChangeEmailForm: FC = observer(() => {
  const {
    currentEmail,
    pendingEmail,
    emailForm,
    codeForm,
    requestChange,
    confirmChange,
    cancel,
  } = useChangeEmailVM();

  return (
    <Col gap={12}>
      <Text textStyle={"Body_M1"}>{currentEmail ?? "Email не указан"}</Text>

      <VerifyCurrentEmail />

      {pendingEmail ? (
        <Form form={codeForm} onSubmit={confirmChange} style={styles.form}>
          <Text textStyle={"Body_S2"} color={"textSecondary"}>
            {`Введите код, отправленный на ${pendingEmail}`}
          </Text>
          <TextFieldFormField<TCodeForm>
            name={"code"}
            label={"Код из письма"}
            keyboardType={"number-pad"}
          />
          <FormSubmit size={"small"}>{"Подтвердить смену"}</FormSubmit>
          <Button size={"small"} appearance={"ghost"} onPress={cancel}>
            {"Отмена"}
          </Button>
        </Form>
      ) : (
        <Form form={emailForm} onSubmit={requestChange} style={styles.form}>
          <TextFieldFormField<TEmailForm>
            name={"email"}
            label={"Новый email"}
            keyboardType={"email-address"}
            autoCapitalize={"none"}
          />
          <FormSubmit size={"small"}>{"Сменить email"}</FormSubmit>
        </Form>
      )}
    </Col>
  );
});

const styles = StyleSheet.create({ form: { gap: 8 } });
