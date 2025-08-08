import {
  Button,
  Container,
  Content,
  Header,
  ScrollView,
  TextField,
} from "@components";
import { StackProps } from "@navigation";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";

import { useSignInVM } from "./hooks";

export const RecoveryPassword: FC<StackProps> = observer(() => {
  const {
    form,
    handleLogin,
    handleNavigateSignUp,
    handleNavigateRecoveryPassword,
  } = useSignInVM();

  const login = form.watch("login");
  const password = form.watch("password");

  return (
    <Container>
      <Header />
      <Content>
        <ScrollView>
          <TextField
            label={"Username"}
            value={login}
            onChangeText={text => form.setValue("login", text)}
          />

          <TextField
            label={"Password"}
            value={password}
            onChangeText={text => form.setValue("password", text)}
          />

          <Button onPress={handleLogin} loading={form.formState.isSubmitting}>
            {"Войти"}
          </Button>
        </ScrollView>
      </Content>
    </Container>
  );
});
