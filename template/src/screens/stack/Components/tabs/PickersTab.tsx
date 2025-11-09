import {
  Button,
  Col,
  DatePicker,
  RangePicker,
  TimePicker,
  Title,
  YearRangePicker,
} from "@components";
import { TabProps, useTransition } from "@core";
import React, { FC, memo } from "react";

export const PickersTab: FC<TabProps> = memo(({ route }) => {
  const { navbarHeight } = useTransition();

  return (
    <Col ph={16} gap={8} pt={navbarHeight}>
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
