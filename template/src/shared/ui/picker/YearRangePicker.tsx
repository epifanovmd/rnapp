import React, { FC, memo, PropsWithChildren } from "react";

import { RangePicker, RangePickerProps } from "./RangePicker";

export interface YearRangePickerProps extends Omit<
  RangePickerProps<number>,
  "items"
> {}

const count = 135;

const years = Array.from({ length: count }, (_, i) => {
  return i + new Date().getFullYear() - count + 2;
});

export const YearRangePicker: FC<PropsWithChildren<YearRangePickerProps>> =
  memo(({ title = "Годы", ...props }) => {
    return (
      <RangePicker<number>
        title={title}
        {...props}
        items={years}
        reverse={true}
      />
    );
  });
