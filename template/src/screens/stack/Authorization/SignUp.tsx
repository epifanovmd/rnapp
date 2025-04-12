import {
  Button,
  Container,
  Content,
  Field,
  Header,
  Input,
  ScrollView,
} from "@components";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";

import { StackProps } from "../../../navigation";
import { useSignInVM } from "./hooks";

export const SignUp: FC<StackProps> = observer(() => {
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
          <Field>
            <Field.Label text={"Username"} />
            <Field.Content>
              <Input
                value={login}
                onChangeText={text => form.setValue("login", text)}
              />
            </Field.Content>
          </Field>

          <Field>
            <Field.Label text={"Password"} />
            <Field.Content>
              <Input
                value={password}
                onChangeText={text => form.setValue("password", text)}
              />
            </Field.Content>
          </Field>

          <Button onPress={handleLogin} loading={form.formState.isSubmitting}>
            {"Войти"}
          </Button>
        </ScrollView>
      </Content>
    </Container>
  );
});
