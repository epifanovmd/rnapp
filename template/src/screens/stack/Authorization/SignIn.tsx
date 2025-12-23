import { useBiometric } from "@common";
import {
  Button,
  Col,
  Container,
  Content,
  Row,
  Text,
  TextField,
} from "@components";
import { StackProps, useTheme } from "@core";
import { ScanFace } from "lucide-react-native";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";

import { useSignInVM } from "./hooks";

export const SignIn: FC<StackProps<"SignIn">> = observer(
  ({ route: { params: { code } = {} } }) => {
    const { colors } = useTheme();

    const {
      form,
      processingAuth,
      loginByGithub,
      handleLogin,
      handleNavigateSignUp,
      handleNavigateRecoveryPassword,
    } = useSignInVM({ code });

    const { available, authorization } = useBiometric();

    const login = form.watch("login");
    const password = form.watch("password");

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
                  <ScanFace color={colors["onSurfaceHigh"]} />
                </Button>
              )}
            </Row>
            <Row gap={8} alignItems={"center"}>
              <Col
                bg={colors["onSurfaceHigh"]}
                style={{ borderStyle: "dashed" }}
                height={1}
                flex={1}
              />
              <Text color={"onSurfaceHigh"} textAlign={"center"}>
                {"или"}
              </Text>
              <Col
                bg={colors["onSurfaceHigh"]}
                style={{ borderStyle: "dashed" }}
                height={1}
                flex={1}
              />
            </Row>
            <Button
              loading={processingAuth}
              flex={1}
              size={"small"}
              onPress={loginByGithub}
            >
              {"Войти через Github"}
            </Button>
          </Col>
        </Content>
      </Container>
    );
  },
);
