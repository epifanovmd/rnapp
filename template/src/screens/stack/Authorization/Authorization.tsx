import { Input } from "@force-dev/react-mobile";
import { observer } from "mobx-react-lite";
import React, { FC, memo } from "react";

import {
  Button,
  Container,
  Content,
  Field,
  Header,
  ScrollView,
  Text,
} from "../../../components";
import { StackProps } from "../../../navigation";
import { useAuthorizationVM } from "./hooks";

export const Authorization: FC<StackProps> = observer(({ route }) => {
  const { username, password, onLogin, isLoading } = useAuthorizationVM();

  return (
    <Container>
      <Header backAction={true} />
      <Content>
        <ScrollView>
          <Field>
            <Field.Label text={"Username"} />
            <Field.Content>
              <Input value={username.value} onChangeText={username.setValue} />
            </Field.Content>
          </Field>

          <Field>
            <Field.Label text={"Password"} />
            <Field.Content>
              <Input value={password.value} onChangeText={password.setValue} />
            </Field.Content>
          </Field>

          <Button onPress={onLogin} loading={isLoading}>
            {"Войти"}
          </Button>
        </ScrollView>
      </Content>
    </Container>
  );
});
