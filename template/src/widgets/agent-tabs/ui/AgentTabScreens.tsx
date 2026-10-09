import { WorkerFetchConsole } from "@features/fetch-agent-worker";
import { useFocusedScroll } from "@shared/lib/scroll";
import { Col, ScreenScroll, useNavbarInset } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC, ReactNode } from "react";

import { useAgentTabs } from "../model/agent-tabs-context";
import { AgentConfigsList } from "./AgentConfigsList";
import { AgentEventsList } from "./AgentEventsList";
import { AgentLogsPanel } from "./AgentLogsPanel";
import { AgentOverview } from "./AgentOverview";
import { AgentWorkersList } from "./AgentWorkersList";

/** Прокрутка вкладки под скрывающейся шапкой. */
const TabScroll: FC<{ children: ReactNode; refresh?: boolean }> = ({
  children,
  refresh = true,
}) => {
  const { onRefresh } = useAgentTabs();
  const telemetry = useFocusedScroll();
  const navbarInset = useNavbarInset();

  return (
    <ScreenScroll
      telemetry={telemetry}
      topInset={navbarInset}
      onRefresh={refresh ? onRefresh : undefined}
    >
      {children}
    </ScreenScroll>
  );
};

/** «Обзор»: начало от экрана и метрики агента. */
export const AgentOverviewScreen: FC = observer(() => {
  const { agent, overview } = useAgentTabs();

  return (
    <TabScroll>
      <Col gap={12}>
        {overview}
        {!!agent && <AgentOverview key={agent.id} agent={agent} />}
      </Col>
    </TabScroll>
  );
});

/** «Воркеры». */
export const AgentWorkersScreen: FC = observer(() => {
  const { agent, access } = useAgentTabs();

  return (
    <TabScroll>
      {!!agent && (
        <AgentWorkersList
          key={agent.id}
          agent={agent}
          canManage={access.canManage}
        />
      )}
    </TabScroll>
  );
});

/** «Настройки». */
export const AgentConfigsScreen: FC = observer(() => {
  const { agent, access } = useAgentTabs();

  return (
    <TabScroll>
      {!!agent && (
        <AgentConfigsList
          key={agent.id}
          agent={agent}
          canConfig={access.canConfig}
        />
      )}
    </TabScroll>
  );
});

/** «Запрос» к воркеру. */
export const AgentFetchScreen: FC = observer(() => {
  const { agent } = useAgentTabs();

  return (
    <TabScroll refresh={false}>
      {!!agent && <WorkerFetchConsole key={agent.id} agent={agent} />}
    </TabScroll>
  );
});

/** «События». */
export const AgentEventsScreen: FC = observer(() => {
  const { agent } = useAgentTabs();

  return (
    <TabScroll>
      {!!agent && <AgentEventsList key={agent.id} agent={agent} />}
    </TabScroll>
  );
});

/** «Журнал». */
export const AgentLogsScreen: FC = observer(() => {
  const { agent, access } = useAgentTabs();

  return (
    <TabScroll refresh={false}>
      {!!agent && (
        <AgentLogsPanel key={agent.id} agent={agent} canLogs={access.canLogs} />
      )}
    </TabScroll>
  );
});
