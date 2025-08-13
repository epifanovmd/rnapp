import {
  Col,
  Container,
  Content,
  DatePicker,
  RangePicker,
  Text,
  TextButton,
  TimePicker,
  YearRangePicker,
} from "@components";
import { StackProps } from "@navigation";
import React, { FC, memo } from "react";

export const Pickers: FC<StackProps> = memo(({ route }) => (
  <Container>
    <Content>
      <Text>{route.name}</Text>

      <Col mt={16}>
        <RangePicker items={[1, 2, 3]}>
          <TextButton>{"Range picker"}</TextButton>
        </RangePicker>

        <YearRangePicker>
          <TextButton>{"Year range picker"}</TextButton>
        </YearRangePicker>

        <DatePicker
          onChange={date => {
            console.log("date", date);
          }}
        >
          <TextButton>{"Date picker"}</TextButton>
        </DatePicker>

        <TimePicker
          onChange={time => {
            console.log("time", time);
          }}
        >
          <TextButton>{"Time picker"}</TextButton>
        </TimePicker>
      </Col>
    </Content>
  </Container>
));
