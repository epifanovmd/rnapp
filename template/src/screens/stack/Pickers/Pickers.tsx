import {
  Button,
  Col,
  Container,
  Content,
  DatePicker,
  RangePicker,
  Text,
  TimePicker,
  YearRangePicker,
} from "@components";
import { StackProps } from "@core";
import React, { FC, memo } from "react";

export const Pickers: FC<StackProps> = memo(({ route }) => (
  <Container>
    <Content>
      <Text>{route.name}</Text>

      <Col mt={16}>
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
    </Content>
  </Container>
));
