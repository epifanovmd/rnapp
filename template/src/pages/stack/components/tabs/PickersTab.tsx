import { useTransition } from "@shared/lib/transition";
import {
  Button,
  Col,
  DatePicker,
  RangePicker,
  TimePicker,
  Title,
  YearRangePicker,
} from "@shared/ui";
import React, { FC, memo } from "react";

import { ComponentsTabProps } from "../components.types";

export const PickersTab: FC<ComponentsTabProps> = memo(({ route }) => {
  const { navbar } = useTransition();

  return (
    <Col ph={16} gap={8} pt={navbar.height}>
      <RangePicker items={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}>
        <Button>{"Range picker"}</Button>
      </RangePicker>

      <YearRangePicker
        onChange={date => {
          console.log("date", date);
        }}
      >
        <Button>{"Year range picker"}</Button>
      </YearRangePicker>

      <DatePicker
        onChange={date => {
          console.log("date", date);
        }}
      >
        <Button>{"Date picker"}</Button>
      </DatePicker>

      <TimePicker
        onChange={time => {
          console.log("time", time);
        }}
      >
        <Button>{"Time picker"}</Button>
      </TimePicker>
    </Col>
  );
});
