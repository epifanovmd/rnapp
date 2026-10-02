import { Avatar, Col, NavbarSubTitle, NavbarTitle, Row } from "@shared/ui";
import React, { FC } from "react";

interface IAppMenuProfileCompactProps {
  displayName: string;
  subtitle?: string;
  avatarUrl?: string;
}

/** Компактный профиль для навбара: мини-аватар, имя и контакт. */
export const AppMenuProfileCompact: FC<IAppMenuProfileCompactProps> = ({
  displayName,
  subtitle,
  avatarUrl,
}) => (
  <Row alignItems={"center"} gap={8}>
    <Avatar size={30} url={avatarUrl} name={displayName} />
    <Col flexShrink={1}>
      <NavbarTitle textStyle={"Title_S1"}>{displayName}</NavbarTitle>
      {!!subtitle && (
        <NavbarSubTitle textStyle={"Caption_M3"} color={"textSecondary"}>
          {subtitle}
        </NavbarSubTitle>
      )}
    </Col>
  </Row>
);
