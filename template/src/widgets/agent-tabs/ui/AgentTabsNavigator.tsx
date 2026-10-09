import { useWorkerActionResults } from "@features/manage-agent";
import {
  createMaterialTopTabNavigator,
  type MaterialTopTabBarProps,
} from "@react-navigation/material-top-tabs";
import { ScrollProvider, useScrollTelemetry } from "@shared/lib/scroll";
import { NavbarProvider, useNavbar, useNavbarScrollSync } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";

import {
  AgentTabsContext,
  type IAgentTabsContext,
  useAgentTabs,
} from "../model/agent-tabs-context";
import { AgentTabsBar } from "./AgentTabsBar";
import {
  AgentConfigsScreen,
  AgentEventsScreen,
  AgentFetchScreen,
  AgentLogsScreen,
  AgentOverviewScreen,
  AgentWorkersScreen,
} from "./AgentTabScreens";

type TAgentTabsParamList = {
  Overview: undefined;
  Workers: undefined;
  Configs: undefined;
  Fetch: undefined;
  Events: undefined;
  Logs: undefined;
};

const TopTab = createMaterialTopTabNavigator<TAgentTabsParamList>();

const renderTabBar = (props: MaterialTopTabBarProps) => (
  <AgentTabsBar {...props} />
);

/**
 * Вкладки агента: обзор, воркеры, настройки, запрос (с правом), события,
 * журнал. Без агента — только обзор; вкладка, право на которую отозвано,
 * пропадает — навигатор переходит на первую.
 */
const AgentTabsTopTabs: FC = observer(() => {
  const { agent, access } = useAgentTabs();
  const navbar = useNavbar();
  const telemetry = useScrollTelemetry();

  useNavbarScrollSync(telemetry);
  // Итоги отложенных замен воркеров — на любой вкладке.
  useWorkerActionResults(agent?.id ?? null);

  return (
    <ScrollProvider telemetry={telemetry}>
      <TopTab.Navigator
        tabBar={renderTabBar}
        backBehavior={"none"}
        screenOptions={{ lazy: true }}
        screenListeners={navbar.screenListeners}
      >
        <TopTab.Screen
          name={"Overview"}
          component={AgentOverviewScreen}
          options={{ title: "Обзор" }}
        />
        {!!agent && (
          <>
            <TopTab.Screen
              name={"Workers"}
              component={AgentWorkersScreen}
              options={{ title: "Воркеры" }}
            />
            <TopTab.Screen
              name={"Configs"}
              component={AgentConfigsScreen}
              options={{ title: "Настройки" }}
            />
            {access.canFetch && (
              <TopTab.Screen
                name={"Fetch"}
                component={AgentFetchScreen}
                options={{ title: "Запрос" }}
              />
            )}
            <TopTab.Screen
              name={"Events"}
              component={AgentEventsScreen}
              options={{ title: "События" }}
            />
            <TopTab.Screen
              name={"Logs"}
              component={AgentLogsScreen}
              options={{ title: "Журнал" }}
            />
          </>
        )}
      </TopTab.Navigator>
    </ScrollProvider>
  );
});

/** Экран с вкладками агента под скрывающейся шапкой экрана. */
export const AgentTabsNavigator: FC<IAgentTabsContext> = props => (
  <AgentTabsContext.Provider value={props}>
    <NavbarProvider>
      <AgentTabsTopTabs />
    </NavbarProvider>
  </AgentTabsContext.Provider>
);
