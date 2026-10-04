import { Col, NavLink, Row, ScreenScroll, Text } from "@shared/ui";
import React, { FC, memo } from "react";

import { COMPONENT_DEMOS } from "./component-demos";

type TDemoGroup = (typeof COMPONENT_DEMOS)[number];

/** Высота группы в строках: одиночная ссылка или заголовок с вариантами. */
const groupLines = (group: TDemoGroup) =>
  group.demos.length === 1 ? 1 : group.demos.length + 1;

/** Делит группы на две колонки близкой высоты, сохраняя порядок. */
const splitIntoColumns = (groups: readonly TDemoGroup[]) => {
  const total = groups.reduce((sum, group) => sum + groupLines(group), 0);
  let lines = 0;
  const index = groups.findIndex(group => {
    lines += groupLines(group);

    return lines >= total / 2;
  });

  return [groups.slice(0, index + 1), groups.slice(index + 1)];
};

const COLUMNS = splitIntoColumns(COMPONENT_DEMOS);

const renderGroup = (group: TDemoGroup) =>
  group.demos.length === 1 ? (
    <NavLink key={group.title} to={group.demos[0].route} hitSlop={8}>
      <Text textStyle={"Body_S1"} color={"textLink"}>
        {`${group.title} →`}
      </Text>
    </NavLink>
  ) : (
    <Col key={group.title} alignItems={"flex-start"} gap={10}>
      <Text textStyle={"Body_S1"} color={"textSecondary"}>
        {group.title}
      </Text>
      <Col alignItems={"flex-start"} gap={12} pl={12}>
        {group.demos.map(demo => (
          <NavLink key={demo.route} to={demo.route} hitSlop={8}>
            <Text textStyle={"Body_S1"} color={"textLink"}>
              {`${demo.title} →`}
            </Text>
          </NavLink>
        ))}
      </Col>
    </Col>
  );

/** Плейграунд кита: ссылки на демо-экраны в две колонки, варианты одного компонента — под общим заголовком. */
export const Components: FC = memo(() => (
  <ScreenScroll>
    <Row gap={16} alignItems={"flex-start"}>
      {COLUMNS.map((column, index) => (
        <Col key={index} flex={1} alignItems={"flex-start"} gap={16}>
          {column.map(renderGroup)}
        </Col>
      ))}
    </Row>
  </ScreenScroll>
));
