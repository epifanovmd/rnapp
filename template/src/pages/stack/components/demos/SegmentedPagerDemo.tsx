import {
  createMaterialTopTabNavigator,
  MaterialTopTabBarProps,
} from "@react-navigation/material-top-tabs";
import { Col, SegmentedTabBar } from "@shared/ui";
import React, { FC } from "react";

import { PagerDemoPage } from "./PagerDemoPage";

type TPagerDemoParamList = {
  Обзор: undefined;
  Задачи: undefined;
  Логи: undefined;
};

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
      <PagerTab.Screen name={"Обзор"} component={PagerDemoPage} />
      <PagerTab.Screen name={"Задачи"} component={PagerDemoPage} />
      <PagerTab.Screen name={"Логи"} component={PagerDemoPage} />
    </PagerTab.Navigator>
  </Col>
);
