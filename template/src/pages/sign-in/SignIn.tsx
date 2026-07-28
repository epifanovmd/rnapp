import { useBiometric } from "@features/biometric";
import { useSignInVM } from "@features/sign-in";
import { StackProps } from "@shared/lib/navigation";
import { useTheme } from "@shared/lib/theme";
import {
  Button,
  Col,
  Container,
  Content,
  Row,
  Text,
  TextField,
} from "@shared/ui";
import { ScanFace } from "lucide-react-native";
import { observer } from "mobx-react-lite";
import React, { FC, useState } from "react";

export const SignIn: FC<StackProps<"SignIn">> = observer(() => {
  const { colors } = useTheme();

  const {
    form,
    loginByGithub,
    handleLogin,
    handleNavigateSignUp,
    handleNavigateRecoveryPassword,
    isTwoFactorRequired,
    twoFactorHint,
    error,
    handleVerify2FA,
  } = useSignInVM();

  const { available, authorization } = useBiometric();

  const [twoFactorPassword, setTwoFactorPassword] = useState("");

  const login = form.watch("login");
  const password = form.watch("password");

  if (isTwoFactorRequired) {
    return (
      <Container>
        <Content justifyContent={"center"}>
          <Col style={{ gap: 8 }}>
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

            {!!error && <Text color={"red500"}>{error}</Text>}

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
        <Col style={{ gap: 8 }}>
          <TextField
            label={"Логин"}
            value={login}
            onChangeText={text => form.setValue("login", text)}
          />

          <TextField
            label={"Пароль"}
            value={password}
            onChangeText={text => form.setValue("password", text)}
            secureTextEntry={true}
          />

          {!!error && <Text color={"red500"}>{error}</Text>}

          <Row gap={8} mt={8} alignItems={"center"}>
            <Button
              flex={1}
              size={"small"}
              onPress={handleLogin}
              loading={form.formState.isSubmitting}
            >
              {"Войти"}
            </Button>

            {available && (
              <Button flex={1} size={"small"} onPress={authorization}>
                <ScanFace color={colors.textPrimary} />
              </Button>
            )}
          </Row>
          <Row gap={8} alignItems={"center"}>
            <Col
              bg={colors.textPrimary}
              style={{ borderStyle: "dashed" }}
              height={1}
              flex={1}
            />
            <Text color={"textPrimary"} textAlign={"center"}>
              {"или"}
            </Text>
            <Col
              bg={colors.textPrimary}
              style={{ borderStyle: "dashed" }}
              height={1}
              flex={1}
            />
          </Row>
          <Button flex={1} size={"small"} onPress={loginByGithub}>
            {"Войти через Github"}
          </Button>
        </Col>
      </Content>
    </Container>
  );
});
