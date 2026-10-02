import { Avatar, ListItem } from "@shared/ui";
import React, { FC } from "react";

interface IAppMenuProfileProps {
  displayName: string;
  subtitle?: string;
  avatarUrl?: string;
  onPress: () => void;
}

/** Карточка профиля в шапке меню: аватар, имя, контакт. */
export const AppMenuProfile: FC<IAppMenuProfileProps> = ({
  displayName,
  subtitle,
  avatarUrl,
  onPress,
}) => (
  <ListItem
    leading={<Avatar size={44} url={avatarUrl} name={displayName} />}
    title={displayName}
    subtitle={subtitle}
    onPress={onPress}
  />
);
