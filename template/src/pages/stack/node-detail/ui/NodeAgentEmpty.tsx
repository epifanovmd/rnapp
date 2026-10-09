import type { NodeDto } from "@shared/api/gen/main/model";
import { Button, Col, EmptyState } from "@shared/ui";
import React, { FC } from "react";

interface INodeAgentEmptyProps {
  node: NodeDto;
  /** Можно ставить агента; нет — без кнопок. */
  canProvision: boolean;
  onCommand: () => void;
  onSsh: () => void;
}

/** У узла нет агента: как его установить. */
export const NodeAgentEmpty: FC<INodeAgentEmptyProps> = ({
  node,
  canProvision,
  onCommand,
  onSsh,
}) => (
  <EmptyState
    icon={"server"}
    title={"Агент не установлен"}
    description={
      node.host
        ? "Установите агента командой на узле или по SSH — он сам выйдет на связь и привяжется к узлу"
        : "Установите агента командой на узле — он сам выйдет на связь. Для установки по SSH задайте адрес узла"
    }
    action={
      canProvision && (
        <Col gap={8} alignSelf={"stretch"}>
          <Button
            title={"Команда установки"}
            size={"small"}
            leftIcon={"terminal"}
            onPress={onCommand}
          />
          <Button
            title={"Установить по SSH"}
            variant={"secondary"}
            appearance={"outline"}
            size={"small"}
            leftIcon={"download"}
            onPress={onSsh}
          />
        </Col>
      )
    }
  />
);
