import { IUserStore } from "@entities/user";
import { BiometricMenuItem } from "@features/biometric";
import { SignOutButton } from "@features/sign-out";
import { APP_VERSION } from "@shared/config/app-info";
import { useNavigation } from "@shared/lib/navigation";
import { Col, ListItem, Text } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";

import { APP_MENU_GROUPS } from "../model/constants";
import { AppMenuGroup } from "./AppMenuGroup";
import { AppMenuProfile } from "./AppMenuProfile";
import { ThemeMenuItem } from "./ThemeMenuItem";

/** Меню настроек: профиль, разделы аккаунта, тема, биометрия, выход и версия. */
export const AppMenu: FC = observer(() => {
  const navigation = useNavigation();
  const { model } = IUserStore.useInstance();

  return (
    <Col gap={16}>
      <AppMenuProfile
        displayName={model?.displayName ?? ""}
        subtitle={model?.login ?? undefined}
        avatarUrl={model?.avatarUrl}
        onPress={() => navigation.navigate("Profile")}
      />

      {APP_MENU_GROUPS.map(group => (
        <AppMenuGroup key={group.label} label={group.label}>
          {group.items.map(item => (
            <ListItem
              key={item.route}
              icon={item.icon}
              title={item.label}
              pv={8}
              ph={8}
              onPress={() => navigation.navigate(item.route)}
            />
          ))}
        </AppMenuGroup>
      ))}

      <AppMenuGroup label={"Приложение"}>
        <ThemeMenuItem />
        <BiometricMenuItem />
      </AppMenuGroup>

      <SignOutButton />

      <Text
        textStyle={"Caption_M1"}
        color={"textTertiary"}
        textAlign={"center"}
      >
        {`Версия ${APP_VERSION}`}
      </Text>
    </Col>
  );
});
