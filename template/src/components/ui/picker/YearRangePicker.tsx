import React, { FC, memo, PropsWithChildren } from "react";

import { RangePicker, RangePickerProps } from "./RangePicker";

export interface YearRangePickerProps
  extends Omit<RangePickerProps<number>, "items"> {}

const count = 135;

const years = Array.from({ length: count }, (_, i) => {
  return i + new Date().getFullYear() - count + 2;
});

export const YearRangePicker: FC<PropsWithChildren<YearRangePickerProps>> =
  memo(props => {
    return <RangePicker<number> {...props} items={years} reverse={true} />;
  });
