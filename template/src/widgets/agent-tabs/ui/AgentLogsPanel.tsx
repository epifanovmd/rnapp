import {
  AGENT_LOG_LEVEL_LABELS,
  AGENT_LOG_LEVELS,
  ALL_LOG_SOURCES,
  configuredWorkers,
  isAgentLive,
  type TAgentLogLevel,
} from "@entities/agent";
import type { AgentDto } from "@shared/api/gen/main/model";
import {
  Button,
  Col,
  Notice,
  Section,
  Segmented,
  type SegmentedOption,
  Text,
} from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";
import { ScrollView } from "react-native";

import {
  AGENT_LOG_SOURCE,
  LOG_LINES_OPTIONS,
  useAgentLogsVM,
} from "../model/useAgentLogsVM";
import { AgentLiveLog } from "./AgentLiveLog";
import { FilterChips } from "./FilterChips";
import { monoStyles } from "./mono-style";

interface IAgentLogsPanelProps {
  agent: AgentDto;
  /** Можно запросить записи журнала с узла. */
  canLogs: boolean;
}

const LEVEL_OPTIONS: SegmentedOption<TAgentLogLevel>[] = AGENT_LOG_LEVELS.map(
  level => ({ value: level, label: AGENT_LOG_LEVEL_LABELS[level] }),
);

const LINES_OPTIONS: SegmentedOption[] = LOG_LINES_OPTIONS.map(lines => ({
  value: String(lines),
  label: String(lines),
}));

const sourceLabel = (source: string): string =>
  source === AGENT_LOG_SOURCE ? "агент" : `воркер ${source}`;

/**
 * Журнал агента: живые записи агента и воркеров (уровень меняется на
 * сервере) и, с правом на журнал, последние записи агента или воркера с узла.
 */
export const AgentLogsPanel: FC<IAgentLogsPanelProps> = observer(
  ({ agent, canLogs }) => {
    const vm = useAgentLogsVM(agent.id);
    const { live } = vm;
    const online = isAgentLive(agent);

    return (
      <Col gap={12}>
        <Section
          title={"Живой журнал"}
          description={"Записи агента и воркеров по мере появления"}
        >
          <Segmented
            value={live.level}
            onValueChange={live.setLevel}
            options={LEVEL_OPTIONS}
            scrollable
          />
          {live.sources.length > 0 && (
            <FilterChips
              value={live.source}
              onChange={live.setSource}
              options={[
                { value: ALL_LOG_SOURCES, label: "Все источники" },
                ...live.sources.map(source => ({
                  value: source,
                  label: sourceLabel(source),
                })),
              ]}
            />
          )}
          <AgentLiveLog
            entries={live.entries}
            emptyText={
              online
                ? "Записей пока нет — новые появятся здесь"
                : "Агент без связи: живого журнала нет"
            }
          />
          <Button
            title={"Очистить"}
            variant={"secondary"}
            appearance={"outline"}
            size={"small"}
            leftIcon={"trash"}
            onPress={live.clear}
          />
        </Section>

        {canLogs && (
          <Section
            title={"Журнал с узла"}
            description={"Последние записи агента или воркера"}
          >
            <FilterChips
              value={vm.source}
              onChange={vm.setSource}
              options={[
                { value: AGENT_LOG_SOURCE, label: "агент" },
                ...configuredWorkers(agent).map(worker => ({
                  value: worker.name,
                  label: sourceLabel(worker.name),
                })),
              ]}
            />
            <Segmented
              value={String(vm.lines)}
              onValueChange={value => vm.setLines(Number(value))}
              options={LINES_OPTIONS}
            />
            <Button
              title={"Загрузить"}
              variant={"secondary"}
              appearance={"outline"}
              size={"small"}
              leftIcon={"download"}
              loading={vm.isTailLoading}
              disabled={!online}
              onPress={vm.loadTail}
            />
            {!!vm.tailError && (
              <Notice variant={"danger"} description={vm.tailError} />
            )}
            {vm.tail !== null && (
              <Col bg={"onSurface"} radius={12} pa={12}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Text
                    textStyle={"Caption_M3"}
                    style={monoStyles.mono}
                    selectable
                  >
                    {vm.tail}
                  </Text>
                </ScrollView>
              </Col>
            )}
          </Section>
        )}
      </Col>
    );
  },
);
