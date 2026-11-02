import {
  Button,
  Col,
  Divider,
  Form,
  FormSubmit,
  Row,
  Text,
  TextFieldFormField,
} from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC, ReactNode } from "react";
import { StyleSheet } from "react-native";

import { useSignInVM } from "../model/useSignInVM";
import { TSignInForm } from "../model/validation";
import { TwoFactorPrompt } from "./TwoFactorPrompt";

interface ISignInFormProps {
  onForgotPassword: () => void;
  onSignUp: () => void;
  /** Дополнительные способы входа под разделителем «или» (биометрия и т.п.). */
  alternatives?: ReactNode;
}

/** Форма входа: логин/пароль, второй фактор, альтернативные способы и GitHub OAuth. */
export const SignInForm: FC<ISignInFormProps> = observer(
  ({ onForgotPassword, onSignUp, alternatives }) => {
    const {
      form,
      handleLogin,
      loginByGithub,
      isLoading,
      isTwoFactorRequired,
      twoFactorHint,
      handleVerify2FA,
    } = useSignInVM();

    return (
      <Col gap={24}>
        <Col gap={6}>
          <Text textStyle={"Title_XL"}>{"Вход"}</Text>
          <Text textStyle={"Body_S2"} color={"textSecondary"}>
            {"Войдите в аккаунт, чтобы продолжить"}
          </Text>
        </Col>

        <Form form={form} onSubmit={handleLogin} style={styles.form}>
          <TextFieldFormField<TSignInForm>
            name={"login"}
            label={"Email или телефон"}
            placeholder={"email@example.com"}
            autoCapitalize={"none"}
            autoCorrect={false}
            keyboardType={"email-address"}
            textContentType={"username"}
          />
          <TextFieldFormField<TSignInForm>
            name={"password"}
            label={"Пароль"}
            placeholder={"••••••••"}
            secureTextEntry={true}
            textContentType={"password"}
          />

          <Row justifyContent={"flex-end"}>
            <Button
              appearance={"link"}
              title={"Забыли пароль?"}
              onPress={onForgotPassword}
            />
          </Row>

          {isTwoFactorRequired ? (
            <TwoFactorPrompt hint={twoFactorHint} onVerify={handleVerify2FA} />
          ) : (
            <FormSubmit title={"Войти"} loading={isLoading} />
          )}

          {!isTwoFactorRequired && (
            <>
              <Divider label={"или"} />
              {alternatives}
              <Button
                appearance={"outline"}
                leftIcon={"externalLink"}
                title={"Войти через GitHub"}
                onPress={loginByGithub}
              />
            </>
          )}
        </Form>

        <Row justifyContent={"center"} alignItems={"center"} gap={4}>
          <Text textStyle={"Body_S2"} color={"textSecondary"}>
            {"Нет аккаунта?"}
          </Text>
          <Button
            appearance={"link"}
            title={"Зарегистрироваться"}
            onPress={onSignUp}
          />
        </Row>
      </Col>
    );
  },
);

const styles = StyleSheet.create({
  form: { gap: 12 },
});
