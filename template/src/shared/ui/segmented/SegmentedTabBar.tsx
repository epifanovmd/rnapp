import { MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";
import { CommonActions } from "@react-navigation/native";
import React, { useMemo } from "react";

import { ISegmentedProps, Segmented, SegmentedOption } from "./Segmented";
import { usePagerProgress } from "./usePagerProgress";

export type ISegmentedTabBarProps = MaterialTopTabBarProps &
  Omit<ISegmentedProps, "options" | "value" | "onValueChange" | "progress">;

/** Таб-бар для material-top-tabs: Segmented с индикатором, следующим за свайпом пейджера. */
export const SegmentedTabBar = ({
  state,
  navigation,
  descriptors,
  position,
  layout: _layout,
  jumpTo: _jumpTo,
  ...segmentedProps
}: ISegmentedTabBarProps) => {
  const progress = usePagerProgress(position, state.index);

  const options = useMemo<SegmentedOption[]>(
    () =>
      state.routes.map(route => {
        const { options: routeOptions } = descriptors[route.key] ?? {};
        const label = routeOptions?.tabBarLabel;

        return {
          value: route.key,
          label:
            typeof label === "string"
              ? label
              : (routeOptions?.title ?? route.name),
        };
      }),
    [descriptors, state.routes],
  );

  const handleChange = (key: string, index: number) => {
    const route = state.routes[index];
    const event = navigation.emit({
      type: "tabPress",
      target: key,
      canPreventDefault: true,
    });

    if (route && index !== state.index && !event.defaultPrevented) {
      navigation.dispatch({
        ...CommonActions.navigate(route.name, route.params),
        target: state.key,
      });
    }
  };

  return (
    <Segmented
      {...segmentedProps}
      options={options}
      value={state.routes[state.index]?.key}
      onValueChange={handleChange}
      progress={progress}
    />
  );
};
