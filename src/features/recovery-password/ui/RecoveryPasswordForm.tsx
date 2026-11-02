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

import { useRecoveryPassword } from "../model/useRecoveryPassword";
import { TRecoveryPasswordForm } from "../model/validation";
import { RecoveryPasswordSuccess } from "./RecoveryPasswordSuccess";

interface IRecoveryPasswordFormProps {
  onBack: () => void;
}

/** Запрос ссылки для сброса пароля и экран «письмо отправлено». */
export const RecoveryPasswordForm: FC<IRecoveryPasswordFormProps> = observer(
  ({ onBack }) => {
    const { form, handleSubmit, isSent, sentMessage } = useRecoveryPassword();

    if (isSent) {
      return <RecoveryPasswordSuccess message={sentMessage} onBack={onBack} />;
    }

    return (
      <Col gap={24}>
        <Col gap={6}>
          <Text textStyle={"Title_XL"}>{"Восстановление пароля"}</Text>
          <Text textStyle={"Body_S2"} color={"textSecondary"}>
            {"Введите email или телефон — пришлём ссылку для сброса пароля"}
          </Text>
        </Col>
        <Form form={form} onSubmit={handleSubmit} style={styles.form}>
          <TextFieldFormField<TRecoveryPasswordForm>
            name={"login"}
            label={"Email или телефон"}
            placeholder={"email@example.com"}
            autoCapitalize={"none"}
            autoCorrect={false}
            keyboardType={"email-address"}
          />
          <FormSubmit title={"Отправить ссылку"} />
          <Button
            appearance={"outline"}
            title={"Вернуться к входу"}
            onPress={onBack}
          />
        </Form>
      </Col>
    );
  },
);

const styles = StyleSheet.create({
  form: { gap: 12 },
});
