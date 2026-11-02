import { MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";
import { CommonActions } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";

import { FlexProps, useFlexProps } from "../flex-view";
import { ISegmentLayout } from "./segment-indicator";
import { SegmentedOption } from "./segmented.types";
import { SegmentedTabIndicator } from "./SegmentedTabIndicator";
import { SegmentedTabLabel } from "./SegmentedTabLabel";
import { SegmentedTrack } from "./SegmentedTrack";

export type ISegmentedTabBarProps = MaterialTopTabBarProps &
  FlexProps & {
    disabled?: boolean;
    /** Сегменты по ширине контента с прокруткой и автоцентрированием активного. */
    scrollable?: boolean;
  };

/**
 * Таб-бар для material-top-tabs в виде Segmented. Подложка и цвет подписей —
 * RN Animated поверх `position` пейджера на нативном драйвере: синхронно с
 * пейджером и при свайпе, и при переходе по нажатию.
 */
export const SegmentedTabBar = ({
  state,
  navigation,
  descriptors,
  position,
  layout: _layout,
  jumpTo: _jumpTo,
  disabled,
  scrollable,
  ...rest
}: ISegmentedTabBarProps) => {
  const { style } = useFlexProps(rest);
  const [layouts, setLayouts] = useState<ISegmentLayout[]>([]);
  const count = state.routes.length;

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

  const handleSelect = useCallback(
    (index: number) => {
      const route = state.routes[index];

      if (!route) {
        return;
      }

      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });

      if (index !== state.index && !event.defaultPrevented) {
        navigation.dispatch({
          ...CommonActions.navigate(route.name, route.params),
          target: state.key,
        });
      }
    },
    [navigation, state.index, state.key, state.routes],
  );

  const renderLabel = useCallback(
    (label: string, index: number) => (
      <SegmentedTabLabel
        label={label}
        index={index}
        count={count}
        position={position}
      />
    ),
    [count, position],
  );

  return (
    <SegmentedTrack
      options={options}
      selectedIndex={state.index}
      disabled={disabled}
      scrollable={scrollable}
      style={style}
      itemRole={"tab"}
      indicator={
        <SegmentedTabIndicator
          position={position}
          layouts={layouts}
          count={count}
        />
      }
      renderLabel={renderLabel}
      onLayoutsChange={setLayouts}
      onSelect={handleSelect}
    />
  );
};
