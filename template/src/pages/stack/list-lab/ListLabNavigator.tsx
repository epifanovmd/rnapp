import { createStackNavigator } from "@react-navigation/stack";
import React, { FC } from "react";

import type { ListLabParamList } from "./list-lab.types";
import {
  InitialPositionScreen,
  InputBarInsetScreen,
  ListLabHub,
  MvcpScreen,
  PaginationScreen,
  PerfLegendScreen,
  PerfScreen,
  StickyScreen,
} from "./screens";

const Stack = createStackNavigator<ListLabParamList>();

/** Стенды живут в своём стеке: у каждого свой жест назад и свой жизненный цикл. */
export const ListLabNavigator: FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={"Hub"} component={ListLabHub} />
    <Stack.Screen name={"InitialPosition"} component={InitialPositionScreen} />
    <Stack.Screen name={"Pagination"} component={PaginationScreen} />
    <Stack.Screen name={"Mvcp"} component={MvcpScreen} />
    <Stack.Screen name={"InputBarInset"} component={InputBarInsetScreen} />
    <Stack.Screen name={"Sticky"} component={StickyScreen} />
    <Stack.Screen name={"Perf"} component={PerfScreen} />
    <Stack.Screen name={"PerfLegend"} component={PerfLegendScreen} />
  </Stack.Navigator>
);

ListLabNavigator.displayName = "ListLabNavigator";
