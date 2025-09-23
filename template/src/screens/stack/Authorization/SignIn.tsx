import { useBiometric } from "@common";
import { Button, Col, Container, Content, Row, TextField } from "@components";
import { StackProps } from "@core";
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
            onChangeText={text => form.setValue("login", text)}
          />

          <TextField
            label={"Пароль"}
            value={password}
            onChangeText={text => form.setValue("password", text)}
            secureTextEntry={true}
          />

          <Row gap={8} mt={8}>
            <Button
              flex={1}
              size={"small"}
              onPress={handleLogin}
              loading={form.formState.isSubmitting}
            >
              {"Войти"}
            </Button>

            {available && (
              <Button flex={1} size={"small"} onPress={authorization}>
                {"Войти по биометрии"}
              </Button>
            )}
          </Row>
        </Col>
      </Content>
    </Container>
  );
});
