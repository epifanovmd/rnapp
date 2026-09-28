import {
  AvatarPicker,
  PrivacySettingsForm,
  ProfileForm,
} from "@features/profile-settings";
import { Container, Section } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";
import { StyleSheet } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

export const Profile: FC = observer(() => (
  <Container>
    <KeyboardAwareScrollView
      bottomOffset={16}
      contentContainerStyle={styles.content}
    >
      <Section title={"Аватар"}>
        <AvatarPicker />
      </Section>
      <Section title={"Профиль"}>
        <ProfileForm />
      </Section>
      <Section
        title={"Приватность"}
        description={"Что видят другие пользователи."}
      >
        <PrivacySettingsForm />
      </Section>
    </KeyboardAwareScrollView>
  </Container>
));

const styles = StyleSheet.create({ content: { padding: 8, gap: 16 } });
