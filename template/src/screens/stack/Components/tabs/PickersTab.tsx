import {
  Button,
  Col,
  DatePicker,
  RangePicker,
  TimePicker,
  Title,
  YearRangePicker,
} from "@components";
import { TabProps } from "@core";
import React, { FC, memo } from "react";

export const PickersTab: FC<TabProps> = memo(({ route }) => (
  <Col ph={16} gap={8}>
    <RangePicker items={[1, 2, 3]}>
      <Button>{"Range picker"}</Button>
    </RangePicker>

    <YearRangePicker>
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
));
