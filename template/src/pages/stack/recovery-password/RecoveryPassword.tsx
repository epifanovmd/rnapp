import { useRecoveryPassword } from "@features/recovery-password";
import { useNavigation } from "@shared/lib/navigation";
import { Button, Container, Content, ScrollView, TextField } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";

export const RecoveryPassword: FC = observer(() => {
  const navigation = useNavigation();
  const { form, handleSubmit } = useRecoveryPassword(() =>
    navigation.navigate("SignIn"),
  );

  const login = form.watch("login");

  return (
    <Container>
      <Content>
        <ScrollView>
          <TextField
            label={"Логин"}
            value={login}
            onChangeText={text => form.setValue("login", text)}
          />

          <Button onPress={handleSubmit} loading={form.formState.isSubmitting}>
            {"Восстановить пароль"}
          </Button>
        </ScrollView>
      </Content>
    </Container>
  );
});
