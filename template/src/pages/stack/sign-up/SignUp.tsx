import { TSignUpForm, useSignUpVM } from "@features/sign-up";
import {
  Container,
  Content,
  Form,
  FormSubmit,
  ScrollView,
  TextFieldFormField,
} from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";

export const SignUp: FC = observer(() => {
  const { form, handleSignUp } = useSignUpVM();

  return (
    <Container>
      <Content>
        <ScrollView>
          <Form form={form} onSubmit={handleSignUp}>
            <TextFieldFormField<TSignUpForm>
              name={"login"}
              label={"Username"}
            />

            <TextFieldFormField<TSignUpForm>
              name={"password"}
              label={"Password"}
              secureTextEntry={true}
            />

            <TextFieldFormField<TSignUpForm>
              name={"confirmPassword"}
              label={"confirmPassword"}
              secureTextEntry={true}
            />

            <FormSubmit>{"Зарегистрироваться"}</FormSubmit>
          </Form>
        </ScrollView>
      </Content>
    </Container>
  );
});
