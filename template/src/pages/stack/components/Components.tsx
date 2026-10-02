import { Col, NavLink, ScreenScroll, Text } from "@shared/ui";
import React, { FC, memo } from "react";

import { COMPONENT_DEMOS } from "./component-demos";

/** Плейграунд кита: ссылки на демо-экраны компонентов. */
export const Components: FC = memo(() => (
  <ScreenScroll>
    <Col alignItems={"flex-start"} gap={16}>
      {COMPONENT_DEMOS.map(demo => (
        <NavLink key={demo.route} to={demo.route} hitSlop={8}>
          <Text textStyle={"Body_S1"} color={"textLink"}>
            {demo.title}
          </Text>
        </NavLink>
      ))}
    </Col>
  </ScreenScroll>
));
