import { ConfigStateTag, formatAgo } from "@entities/agent";
import { Col, Divider, IconButton, Row, Section, Tag, Text } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC, Fragment } from "react";

import type {
  AgentConfigsVM,
  IWorkerConfigGroup,
} from "../model/useAgentConfigsVM";
import { monoStyles } from "./mono-style";

interface IWorkerConfigsCardProps {
  group: IWorkerConfigGroup;
  vm: AgentConfigsVM;
}

/**
 * Ключи настроек воркера: описание, версии, статус и ошибка применения.
 * Правка и удаление — только с правом на настройки: без него сервер значения
 * не отдаёт.
 */
export const WorkerConfigsCard: FC<IWorkerConfigsCardProps> = observer(
  ({ group, vm }) => (
    <Section
      title={`Настройки воркера ${group.worker}`}
      description={
        group.noManifest
          ? "Манифеста нет — какие ключи у воркера, неизвестно"
          : `Ключей в манифесте: ${group.items.filter(item => item.manifest).length}`
      }
    >
      {group.items.length === 0 ? (
        <Text textStyle={"Body_S2"} color={"textSecondary"}>
          {group.noManifest
            ? "Ключи появятся, когда воркер ответит на GET /manifest."
            : "Воркер не объявил ключей настроек."}
        </Text>
      ) : (
        <Col>
          {group.items.map((item, index) => {
            const status = item.entry?.status;
            const config = item.entry?.config;

            return (
              <Fragment key={item.key}>
                {index > 0 && <Divider />}
                <Row gap={8} pv={10} alignItems={"flex-start"}>
                  <Col flex={1} gap={4}>
                    <Row wrap alignItems={"center"} gap={6}>
                      <Text textStyle={"Title_S2"} style={monoStyles.mono}>
                        {item.key}
                      </Text>
                      {!item.manifest && (
                        <Tag variant={"warning"}>{"не в манифесте"}</Tag>
                      )}
                      {status ? (
                        <ConfigStateTag state={status.state} />
                      ) : (
                        <Tag variant={"muted"}>{"не задан"}</Tag>
                      )}
                    </Row>
                    {!!status && (
                      <Text textStyle={"Caption_M3"} color={"textSecondary"}>
                        {[
                          status.version !== null && `версия ${status.version}`,
                          status.applied !== undefined &&
                            status.applied !== status.version &&
                            `применена ${status.applied}`,
                          config && `изменено ${formatAgo(config.updatedAt)}`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </Text>
                    )}
                    {!!item.manifest?.description && (
                      <Text textStyle={"Caption_M3"} color={"textSecondary"}>
                        {item.manifest.description}
                      </Text>
                    )}
                    {!!status?.error && (
                      <Text textStyle={"Caption_M3"} color={"danger"}>
                        {`${status.error.code}: ${status.error.message}`}
                      </Text>
                    )}
                  </Col>
                  {vm.canConfig && (
                    <IconButton
                      name={config ? "edit" : "plus"}
                      size={20}
                      accessibilityLabel={
                        config ? `Изменить ${item.key}` : `Задать ${item.key}`
                      }
                      onPress={() => vm.editor.openFor(item)}
                    />
                  )}
                  {vm.canConfig && !!status && status.version !== null && (
                    <IconButton
                      name={"trash"}
                      size={20}
                      color={"danger"}
                      accessibilityLabel={`Удалить ${item.key}`}
                      onPress={() => vm.editor.remove(item)}
                    />
                  )}
                </Row>
              </Fragment>
            );
          })}
        </Col>
      )}
    </Section>
  ),
);
