import { useBiometric } from "@common";
import {
  BackIcon,
  Button,
  Container,
  Content,
  Field,
  Header,
  Input,
  ScrollView,
  SwitchTheme,
  Text,
} from "@components";
import { Col, Row } from "@force-dev/react-mobile";
import { StackProps } from "@navigation";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";

import { useSignInVM } from "./hooks";

export const SignIn: FC<StackProps> = observer(() => {
  const {
    form,
    handleLogin,
    handleNavigateSignUp,
    handleNavigateRecoveryPassword,
  } = useSignInVM();

  const { available, authorization } = useBiometric();

  const login = form.watch("login");
  const password = form.watch("password");

  return (
    <Container>
      <Content justifyContent={"center"}>
        <Col style={{ gap: 8 }}>
          <Input
            value={login}
            placeholder={"Логин"}
            variant={"filled"}
            onChangeText={text => form.setValue("login", text)}
          />

          <Input
            value={password}
            placeholder={"Пароль"}
            variant={"filled"}
            onChangeText={text => form.setValue("password", text)}
          />

          <Col mt={8}>
            <Button onPress={handleLogin} loading={form.formState.isSubmitting}>
              {"Войти"}
            </Button>

            {available && (
              <Button mt={8} onPress={authorization}>
                {"Войти по биометрии"}
              </Button>
            )}
          </Col>
        </Col>
      </Content>
    </Container>
  );
});
