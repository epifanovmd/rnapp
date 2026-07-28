import { useRecoveryPassword } from "@features/recovery-password";
import { StackProps } from "@shared/lib/navigation";
import { Button, Container, Content, ScrollView, TextField } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";

export const RecoveryPassword: FC<StackProps> = observer(() => {
  const { form, handleSubmit } = useRecoveryPassword();

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
