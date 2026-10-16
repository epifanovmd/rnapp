import {
  createMaterialTopTabNavigator,
  MaterialTopTabBarProps,
} from "@react-navigation/material-top-tabs";
import { Col, SegmentedTabBar } from "@shared/ui";
import React, { FC } from "react";

import { IPagerDemoPageParams, PagerDemoPage } from "./PagerDemoPage";

type TPagerDemoParamList = Record<TPagerDemoRoute, IPagerDemoPageParams>;

type TPagerDemoRoute = "overview" | "tasks" | "logs";

const TABS: { name: TPagerDemoRoute; title: string }[] = [
  { name: "overview", title: "Обзор" },
  { name: "tasks", title: "Задачи" },
  { name: "logs", title: "Логи" },
];

const PagerTab = createMaterialTopTabNavigator<TPagerDemoParamList>();

const HEIGHT = 212;

const SCREEN_OPTIONS = { sceneStyle: { backgroundColor: "transparent" } };

const renderTabBar = (props: MaterialTopTabBarProps) => (
  <SegmentedTabBar {...props} />
);

/** Демо SegmentedTabBar: подложка идёт кадр в кадр с пейджером top-tabs. */
export const SegmentedPagerDemo: FC = () => (
  <Col height={HEIGHT}>
    <PagerTab.Navigator tabBar={renderTabBar} screenOptions={SCREEN_OPTIONS}>
      {TABS.map(({ name, title }) => (
        <PagerTab.Screen
          key={name}
          name={name}
          component={PagerDemoPage}
          options={{ title }}
          initialParams={{ title }}
        />
      ))}
    </PagerTab.Navigator>
  </Col>
);
