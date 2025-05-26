import { useBiometric } from "@common";
import {
  Button,
  Container,
  Content,
  Field,
  Header,
  Input,
  ScrollView,
} from "@components";
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

          {available && (
            <Button mt={8} onPress={authorization}>
              {"Войти по биометрии"}
            </Button>
          )}
        </ScrollView>
      </Content>
    </Container>
  );
});
