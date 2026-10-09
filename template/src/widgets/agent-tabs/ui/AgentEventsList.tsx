import type { AgentDto } from "@shared/api/gen/main/model";
import {
  Button,
  Col,
  Divider,
  EmptyState,
  Section,
  Skeleton,
  Text,
} from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC, Fragment } from "react";

import { useAgentEventsVM } from "../model/useAgentEventsVM";
import { AgentEventItem } from "./AgentEventItem";
import { FilterChips } from "./FilterChips";

interface IAgentEventsListProps {
  agent: AgentDto;
}

const ALL = "*";

/** События воркеров агента с фильтром по воркеру и типу, новые сверху. */
export const AgentEventsList: FC<IAgentEventsListProps> = observer(
  ({ agent }) => {
    const vm = useAgentEventsVM(agent);
    const { feed } = vm;

    return (
      <Section
        title={"События"}
        description={"Что сообщают воркеры, новые сверху"}
      >
        <Col gap={8}>
          <FilterChips
            value={vm.worker ?? ALL}
            onChange={value => vm.setWorker(value === ALL ? null : value)}
            options={[
              { value: ALL, label: "Все воркеры" },
              ...vm.workerOptions.map(name => ({ value: name, label: name })),
            ]}
          />
          {vm.typeOptions.length > 0 && (
            <FilterChips
              value={vm.type ?? ALL}
              onChange={value => vm.setType(value === ALL ? null : value)}
              options={[
                { value: ALL, label: "Все типы" },
                ...vm.typeOptions.map(type => ({ value: type, label: type })),
              ]}
            />
          )}
        </Col>
        {!!vm.declaration?.description && (
          <Text textStyle={"Body_S2"} color={"textSecondary"}>
            {vm.declaration.description}
          </Text>
        )}
        {feed.isLoading && feed.items.length === 0 ? (
          <Skeleton height={96} borderRadius={12} />
        ) : feed.items.length === 0 ? (
          <EmptyState
            icon={"activity"}
            title={"Событий нет"}
            description={
              feed.error?.message ??
              "Воркеры сообщают здесь о том, что у них происходит"
            }
          />
        ) : (
          <Col gap={8}>
            <Col>
              {feed.items.map((event, index) => (
                <Fragment key={`${event.agentId}/${event.id}`}>
                  {index > 0 && <Divider />}
                  <AgentEventItem event={event} />
                </Fragment>
              ))}
            </Col>
            {feed.hasMore && (
              <Button
                title={"Показать ещё"}
                variant={"secondary"}
                appearance={"outline"}
                size={"small"}
                loading={feed.isLoadingMore}
                onPress={feed.loadMore}
              />
            )}
          </Col>
        )}
      </Section>
    );
  },
);
