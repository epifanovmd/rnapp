import { useSignUpVM } from "@features/sign-up";
import { Button, Container, Content, ScrollView, TextField } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";

export const SignUp: FC = observer(() => {
  const { form, handleSignUp } = useSignUpVM();

  const login = form.watch("login");
  const password = form.watch("password");
  const confirmPassword = form.watch("confirmPassword");

  return (
    <Container>
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

          <TextField
            label={"confirmPassword"}
            value={confirmPassword}
            onChangeText={text => form.setValue("confirmPassword", text)}
          />

          <Button onPress={handleSignUp} loading={form.formState.isSubmitting}>
            {"Зарегистрироваться"}
          </Button>
        </ScrollView>
      </Content>
    </Container>
  );
});
