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
      <Header />
      <SwitchTheme marginLeft={"auto"} />

      <Content>
        {/* <ScrollView>*/}
        <Field>
          <Field.Label text={"Username"} />
          <Input
            value={login}
            onChangeText={text => form.setValue("login", text)}
          />
        </Field>

        <Field>
          <Field.Label text={"Password"} />
          <Input
            value={password}
            onChangeText={text => form.setValue("password", text)}
          />
        </Field>

        <Col flex={1} mv={8} pa={8} bg={"#00000010"}>
          <Text mb={16}>{"Test inputs"}</Text>

          <Col style={{ gap: 8 }}>
            <Input placeholder={"First name"} clearable />
            <Input
              variant={"outlined"}
              placeholder={"Password"}
              type={"password"}
              clearable
            />

            <Field label={"Test label"} error={"1"} description={"Desc"}>
              <Input variant={"filled"} placeholder={"Last name"} clearable />
            </Field>

            <Field label={"Test label"} error={"1"} description={"Desc"}>
              <Input
                placeholder={"First name"}
                clearable
                inputStyle={{ padding: 0, minHeight: "auto" }}
              />
            </Field>

            <Field label={"Test label"} error={"1"} description={"Desc"}>
              <Text>{"Test simple text"}</Text>
            </Field>
          </Col>
        </Col>

        <Button
          marginTop={"auto"}
          onPress={handleLogin}
          loading={form.formState.isSubmitting}
        >
          {"Войти"}
        </Button>

        {available && (
          <Button mt={8} onPress={authorization}>
            {"Войти по биометрии"}
          </Button>
        )}
        {/* </ScrollView>*/}
      </Content>
    </Container>
  );
});
