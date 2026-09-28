import {
  ChangeEmailForm,
  ChangePasswordForm,
  DeleteAccountForm,
  TwoFactorForm,
  UsernameForm,
} from "@features/account-security";
import { SignOutAllButton } from "@features/sign-out";
import { Container, Section } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";
import { StyleSheet } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { SessionsSection } from "./SessionsSection";

export const Security: FC = observer(() => (
  <Container>
    <KeyboardAwareScrollView
      bottomOffset={16}
      contentContainerStyle={styles.content}
    >
      <Section title={"Email"}>
        <ChangeEmailForm />
      </Section>
      <Section title={"Username"}>
        <UsernameForm />
      </Section>
      <Section
        title={"Пароль"}
        description={"После смены пароля другие сессии завершаются."}
      >
        <ChangePasswordForm />
      </Section>
      <Section
        title={"Двухфакторная аутентификация"}
        description={"Второй пароль, который спрашивается при входе."}
      >
        <TwoFactorForm />
      </Section>
      <SessionsSection />
      <Section>
        <SignOutAllButton />
      </Section>
      <Section title={"Удаление аккаунта"} description={"Действие необратимо."}>
        <DeleteAccountForm />
      </Section>
    </KeyboardAwareScrollView>
  </Container>
));

const styles = StyleSheet.create({ content: { padding: 8, gap: 16 } });
