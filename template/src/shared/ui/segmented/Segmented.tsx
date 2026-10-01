import React, { useCallback, useEffect } from "react";
import { useSharedValue, withTiming } from "react-native-reanimated";

import { FlexProps, useFlexProps } from "../flex-view";
import { ISegmentLayout } from "./segment-indicator";
import { SegmentedOption } from "./segmented.types";
import { SegmentedIndicator } from "./SegmentedIndicator";
import { SegmentedLabel } from "./SegmentedLabel";
import { SegmentedTrack } from "./SegmentedTrack";

export interface ISegmentedProps<V extends string = string> extends FlexProps {
  options: SegmentedOption<V>[];
  value?: V;
  onValueChange?: (value: V, index: number) => void;
  disabled?: boolean;
  /** Сегменты по ширине контента с горизонтальной прокруткой и автоцентрированием активного. */
  scrollable?: boolean;
  /** Длительность анимации индикатора при смене `value`, мс. */
  duration?: number;
}

/** Сегментированный переключатель с анимированным индикатором выбранного варианта. */
export const Segmented = <V extends string = string,>({
  options,
  value,
  onValueChange,
  disabled,
  scrollable,
  duration = 200,
  ...rest
}: ISegmentedProps<V>) => {
  const { style } = useFlexProps(rest);
  const selected = value ?? options[0]?.value;
  const selectedIndex = options.findIndex(option => option.value === selected);

  const layouts = useSharedValue<ISegmentLayout[]>([]);
  const animatedIndex = useSharedValue(selectedIndex);

  useEffect(() => {
    animatedIndex.value = withTiming(selectedIndex, { duration });
  }, [animatedIndex, duration, selectedIndex]);

  const handleLayoutsChange = useCallback(
    (next: ISegmentLayout[]) => {
      layouts.value = next;
    },
    [layouts],
  );

  const handleSelect = useCallback(
    (index: number) => {
      const option = options[index];

      if (option) {
        onValueChange?.(option.value, index);
      }
    },
    [onValueChange, options],
  );

  const renderLabel = useCallback(
    (label: string, index: number) => (
      <SegmentedLabel label={label} index={index} progress={animatedIndex} />
    ),
    [animatedIndex],
  );

  return (
    <SegmentedTrack
      options={options}
      selectedIndex={selectedIndex}
      disabled={disabled}
      scrollable={scrollable}
      style={style}
      itemRole={"radio"}
      indicator={
        <SegmentedIndicator layouts={layouts} progress={animatedIndex} />
      }
      renderLabel={renderLabel}
      onLayoutsChange={handleLayoutsChange}
      onSelect={handleSelect}
    />
  );
};
