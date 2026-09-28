import {
  TRecoveryPasswordForm,
  useRecoveryPassword,
} from "@features/recovery-password";
import { useNavigation } from "@shared/lib/navigation";
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

export const RecoveryPassword: FC = observer(() => {
  const navigation = useNavigation();
  const { form, handleSubmit } = useRecoveryPassword(() =>
    navigation.navigate("SignIn"),
  );

  return (
    <Container>
      <Content>
        <ScrollView>
          <Form form={form} onSubmit={handleSubmit}>
            <TextFieldFormField<TRecoveryPasswordForm>
              name={"login"}
              label={"Логин"}
            />

            <FormSubmit>{"Восстановить пароль"}</FormSubmit>
          </Form>
        </ScrollView>
      </Content>
    </Container>
  );
});
