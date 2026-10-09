import {
  WorkerHealthTag,
  WorkerPendingTag,
  WorkerStateTag,
} from "@entities/agent";
import { Button, Col, Row, Tag, Text, Touchable } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC, useState } from "react";

import type { AgentWorkersVM, IWorkerRow } from "../model/useAgentWorkersVM";
import { monoStyles } from "./mono-style";
import { WorkerDetails } from "./WorkerDetails";

interface IWorkerRowProps {
  row: IWorkerRow;
  vm: AgentWorkersVM;
}

/**
 * Воркер агента: версия, состояние, самочувствие, отложенная замена и
 * действия; «Подробнее» — манифест, сведения и метрики воркера.
 */
export const WorkerRow: FC<IWorkerRowProps> = observer(({ row, vm }) => {
  const [expanded, setExpanded] = useState(false);
  const { worker, pending } = row;
  const { actions, agent } = vm;
  const access = vm.accessOf(worker);
  const { updateTo } = access;
  const meta = [
    worker.manifest?.version ?? worker.version ?? "версия не сообщена",
    worker.release && "из выпуска",
    !!worker.restarts && `перезапусков: ${worker.restarts}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Col gap={8} pv={10}>
      <Row wrap alignItems={"center"} gap={8}>
        <Text textStyle={"Title_S2"} style={monoStyles.mono} flexShrink={1}>
          {worker.name}
        </Text>
        {!!worker.builtin && <Tag variant={"muted"}>{"встроенный"}</Tag>}
        {!!updateTo && (
          <Tag variant={"warning"} icon={"upgrade"}>
            {`доступна ${updateTo}`}
          </Tag>
        )}
      </Row>
      <Text textStyle={"Caption_M3"} color={"textSecondary"}>
        {meta}
      </Text>

      {agent.online ? (
        <Row wrap alignItems={"center"} gap={6}>
          {!!worker.state && (
            <WorkerStateTag state={worker.state} message={worker.message} />
          )}
          {!!pending && <WorkerPendingTag pending={pending} />}
          {worker.health ? (
            <WorkerHealthTag worker={worker} />
          ) : (
            <Tag variant={"outline"}>{"нет ответа /health"}</Tag>
          )}
        </Row>
      ) : (
        <Row wrap alignItems={"center"} gap={6}>
          <Tag variant={"muted"}>{"неизвестно"}</Tag>
          <Text textStyle={"Caption_M3"} color={"textSecondary"}>
            {`последнее известное: ${worker.state ?? "не сообщалось"}`}
          </Text>
        </Row>
      )}
      {agent.online && worker.state === "invalid" && !!worker.message && (
        <Text textStyle={"Caption_M3"} color={"danger"}>
          {worker.message}
        </Text>
      )}
      {agent.online && !!worker.health?.message && (
        <Text textStyle={"Caption_M3"} color={"textSecondary"}>
          {worker.health.message}
        </Text>
      )}

      {(!!updateTo || access.canRestart || access.canReplaceNow) && (
        <Row wrap gap={8}>
          {!!updateTo && (
            <Button
              title={`Обновить до ${updateTo}`}
              variant={"secondary"}
              appearance={"outline"}
              size={"small"}
              leftIcon={"upgrade"}
              loading={actions.isBusy("update", worker.name)}
              disabled={!!pending}
              onPress={() => actions.update(agent, worker, updateTo)}
            />
          )}
          {access.canRestart && (
            <Button
              title={"Перезапустить"}
              variant={"secondary"}
              appearance={"outline"}
              size={"small"}
              leftIcon={"refresh"}
              loading={actions.isBusy("restart", worker.name)}
              disabled={!!pending}
              onPress={() => actions.restart(agent, worker)}
            />
          )}
          {access.canReplaceNow && (
            <Button
              title={"Заменить сейчас"}
              variant={"danger"}
              appearance={"outline"}
              size={"small"}
              leftIcon={"zap"}
              onPress={() =>
                actions.replaceNow(agent, worker, vm.updateTargetOf(worker))
              }
            />
          )}
        </Row>
      )}

      <Touchable
        alignSelf={"flex-start"}
        hitSlop={8}
        accessibilityRole={"button"}
        onPress={() => setExpanded(value => !value)}
      >
        <Text textStyle={"Body_S2"} color={"primary"}>
          {expanded ? "Скрыть подробности" : "Подробнее"}
        </Text>
      </Touchable>
      {expanded && <WorkerDetails worker={worker} metrics={row.metrics} />}
    </Col>
  );
});
