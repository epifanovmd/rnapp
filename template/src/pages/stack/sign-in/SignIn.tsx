import { useBiometric } from "@features/biometric";
import { TSignInForm, useSignInVM } from "@features/sign-in";
import { useTheme } from "@shared/lib/theme";
import {
  Button,
  Col,
  Container,
  Content,
  Form,
  FormSubmit,
  Row,
  Text,
  TextField,
  TextFieldFormField,
} from "@shared/ui";
import { ScanFace } from "lucide-react-native";
import { observer } from "mobx-react-lite";
import React, { FC, useState } from "react";
import { StyleSheet } from "react-native";

export const SignIn: FC = observer(() => {
  const { colors } = useTheme();

  const {
    form,
    loginByGithub,
    handleLogin,
    isTwoFactorRequired,
    twoFactorHint,
    error,
    handleVerify2FA,
  } = useSignInVM();

  const { available, authorization } = useBiometric();

  const [twoFactorPassword, setTwoFactorPassword] = useState("");

  if (isTwoFactorRequired) {
    return (
      <Container>
        <Content justifyContent={"center"}>
          <Col style={styles.form}>
            <Text color={"textPrimary"}>
              {twoFactorHint
                ? `Введите пароль для подтверждения (${twoFactorHint})`
                : "Введите пароль для подтверждения входа"}
            </Text>

            <TextField
              label={"Пароль"}
              value={twoFactorPassword}
              onChangeText={setTwoFactorPassword}
              secureTextEntry={true}
            />

            {!!error && <Text color={"danger"}>{error}</Text>}

            <Button
              flex={1}
              size={"small"}
              onPress={() => handleVerify2FA(twoFactorPassword)}
            >
              {"Подтвердить"}
            </Button>
          </Col>
        </Content>
      </Container>
    );
  }

  return (
    <Container>
      <Content justifyContent={"center"}>
        <Form form={form} onSubmit={handleLogin} style={styles.form}>
          <TextFieldFormField<TSignInForm> name={"login"} label={"Логин"} />

          <TextFieldFormField<TSignInForm>
            name={"password"}
            label={"Пароль"}
            secureTextEntry={true}
          />

          {!!error && <Text color={"danger"}>{error}</Text>}

          <Row gap={8} mt={8} alignItems={"center"}>
            <FormSubmit flex={1} size={"small"}>
              {"Войти"}
            </FormSubmit>

            {available && (
              <Button flex={1} size={"small"} onPress={authorization}>
                <ScanFace color={colors.textPrimary} />
              </Button>
            )}
          </Row>
          <Row gap={8} alignItems={"center"}>
            <Col
              bg={colors.textPrimary}
              style={styles.divider}
              height={1}
              flex={1}
            />
            <Text color={"textPrimary"} textAlign={"center"}>
              {"или"}
            </Text>
            <Col
              bg={colors.textPrimary}
              style={styles.divider}
              height={1}
              flex={1}
            />
          </Row>
          <Button flex={1} size={"small"} onPress={loginByGithub}>
            {"Войти через Github"}
          </Button>
        </Form>
      </Content>
    </Container>
  );
});

const styles = StyleSheet.create({
  form: { gap: 8 },
  divider: { borderStyle: "dashed" },
});
