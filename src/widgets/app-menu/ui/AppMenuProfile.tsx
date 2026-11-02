import { Avatar, Col, Section, Text, Touchable } from "@shared/ui";
import React, { FC } from "react";

interface IAppMenuProfileProps {
  displayName: string;
  subtitle?: string;
  avatarUrl?: string;
  onPress: () => void;
}

/** Карточка профиля в начале меню: крупный аватар, имя, контакт, переход в профиль. */
export const AppMenuProfile: FC<IAppMenuProfileProps> = ({
  displayName,
  subtitle,
  avatarUrl,
  onPress,
}) => (
  <Section pv={20}>
    <Touchable
      alignItems={"center"}
      gap={6}
      onPress={onPress}
      accessibilityRole={"button"}
      accessibilityLabel={"Открыть профиль"}
    >
      <Col mb={6}>
        <Avatar size={80} url={avatarUrl} name={displayName} />
      </Col>
      <Text textStyle={"Title_L"} numberOfLines={1}>
        {displayName}
      </Text>
      {!!subtitle && (
        <Text textStyle={"Body_S2"} color={"textSecondary"} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
      <Text textStyle={"Body_S2"} color={"primary"} mt={4}>
        {"Профиль"}
      </Text>
    </Touchable>
  </Section>
);
