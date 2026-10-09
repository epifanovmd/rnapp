import { NodeStatusTag, nodeSubtitle } from "@entities/node";
import type { NodeDto } from "@shared/api/gen/main/model";
import { Col, IconButton, Navbar, Row, Text } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";

interface INodeHeaderProps {
  node: NodeDto;
  /** Меню действий; без него кнопки нет. */
  onActions?: () => void;
}

/** Шапка экрана узла: навбар с меню и строка статуса под ним. */
export const NodeHeader: FC<INodeHeaderProps> = observer(
  ({ node, onActions }) => (
    <>
      <Navbar>
        <Navbar.BackButton />
        <Navbar.Content>
          <Col alignItems={"center"} flexShrink={1}>
            <Text textStyle={"Title_S1"} numberOfLines={1}>
              {node.name}
            </Text>
            <Text
              textStyle={"Caption_M3"}
              color={"textSecondary"}
              numberOfLines={1}
            >
              {nodeSubtitle(node)}
            </Text>
          </Col>
        </Navbar.Content>
        <Navbar.Right>
          <Row alignItems={"center"} ph={12}>
            {!!onActions && (
              <IconButton
                name={"moreVertical"}
                accessibilityLabel={"Действия с узлом"}
                onPress={onActions}
              />
            )}
          </Row>
        </Navbar.Right>
      </Navbar>
      <Row ph={16} pb={8}>
        <NodeStatusTag node={node} />
      </Row>
    </>
  ),
);
