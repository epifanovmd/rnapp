import {
  Button,
  Col,
  Form,
  FormSubmit,
  Row,
  Text,
  TextFieldFormField,
} from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";
import { StyleSheet } from "react-native";

import { useSignUpVM } from "../model/useSignUpVM";
import { TSignUpForm } from "../model/validation";

interface ISignUpFormProps {
  onSignIn: () => void;
}

/** Форма регистрации по email или телефону; имя и фамилия необязательны. */
export const SignUpForm: FC<ISignUpFormProps> = observer(({ onSignIn }) => {
  const { form, handleSignUp, isLoading } = useSignUpVM();

  return (
    <Col gap={24}>
      <Col gap={6}>
        <Text textStyle={"Title_XL"}>{"Создать аккаунт"}</Text>
        <Text textStyle={"Body_S2"} color={"textSecondary"}>
          {"Заполните данные для регистрации"}
        </Text>
      </Col>

      <Form form={form} onSubmit={handleSignUp} style={styles.form}>
        <Row gap={12}>
          <Col flex={1}>
            <TextFieldFormField<TSignUpForm>
              name={"firstName"}
              label={"Имя"}
              autoComplete={"given-name"}
              textContentType={"givenName"}
            />
          </Col>
          <Col flex={1}>
            <TextFieldFormField<TSignUpForm>
              name={"lastName"}
              label={"Фамилия"}
              autoComplete={"family-name"}
              textContentType={"familyName"}
            />
          </Col>
        </Row>
        <TextFieldFormField<TSignUpForm>
          name={"login"}
          label={"Email или телефон"}
          placeholder={"email@example.com"}
          autoCapitalize={"none"}
          autoCorrect={false}
          keyboardType={"email-address"}
        />
        <TextFieldFormField<TSignUpForm>
          name={"password"}
          label={"Пароль"}
          placeholder={"••••••••"}
          secureTextEntry={true}
          textContentType={"newPassword"}
          rules={{ deps: "confirmPassword" }}
        />
        <TextFieldFormField<TSignUpForm>
          name={"confirmPassword"}
          label={"Подтверждение пароля"}
          placeholder={"••••••••"}
          secureTextEntry={true}
          textContentType={"newPassword"}
        />
        <FormSubmit title={"Создать аккаунт"} loading={isLoading} />
      </Form>

      <Row justifyContent={"center"} alignItems={"center"} gap={4}>
        <Text textStyle={"Body_S2"} color={"textSecondary"}>
          {"Уже есть аккаунт?"}
        </Text>
        <Button appearance={"link"} title={"Войти"} onPress={onSignIn} />
      </Row>
    </Col>
  );
});

const styles = StyleSheet.create({
  form: { gap: 12 },
});
