import { BiometricMenuItem } from "@features/biometric";
import { SignOutButton } from "@features/sign-out";
import { APP_VERSION } from "@shared/config/app-info";
import { useNavigation } from "@shared/lib/navigation";
import type { IScrollReveal } from "@shared/lib/scroll-reveal";
import { Col, ListItem, ScrollRevealAnchor, Text } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";

import { APP_MENU_GROUPS } from "../model/constants";
import { useMenuProfile } from "../model/useMenuProfile";
import { AppMenuGroup } from "./AppMenuGroup";
import { AppMenuProfile } from "./AppMenuProfile";
import { ThemeMenuItem } from "./ThemeMenuItem";

interface IAppMenuProps {
  /** Переход карточки профиля в навбар (`AppMenuNavbar`) при прокрутке. */
  reveal?: IScrollReveal;
}

/** Меню настроек: профиль, разделы аккаунта, тема, биометрия, выход и версия. */
export const AppMenu: FC<IAppMenuProps> = observer(({ reveal }) => {
  const navigation = useNavigation();
  const profile = useMenuProfile();
  const profileCard = (
    <AppMenuProfile
      {...profile}
      onPress={() => navigation.navigate("Profile")}
    />
  );

  return (
    <Col gap={16}>
      {reveal ? (
        <ScrollRevealAnchor reveal={reveal}>{profileCard}</ScrollRevealAnchor>
      ) : (
        profileCard
      )}

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
