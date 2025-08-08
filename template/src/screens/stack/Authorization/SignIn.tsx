import { useBiometric } from "@common";
import { Button, Container, Content, TextField } from "@components";
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
          <TextField
            label={"Логин"}
            value={login}
            iconName={"check"}
            clearable={true}
            onChangeText={text => form.setValue("login", text)}
          />

          <TextField
            label={"Пароль"}
            value={password}
            onChangeText={text => form.setValue("password", text)}
            secureTextEntry={true}
            clearable={true}
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
