import "dayjs/locale/ru";

import { useNavigation } from "@shared/lib/navigation";
import {
  Button,
  Calendar,
  Col,
  Container,
  Content,
  Row,
  ScrollView,
  Text,
  useBottomSheetRef,
  useCalendarRef,
} from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";
import { View } from "react-native";

import { CalendarSettingsSheet } from "./CalendarSettingsSheet";
import { renderUnluckyDay } from "./UnluckyDay";
import { useCalendarDemoSettings } from "./useCalendarDemoSettings";

export const CalendarDemo: FC = observer(() => {
  const navigation = useNavigation();
  const calendar = useCalendarRef();
  const sheet = useBottomSheetRef();
  const settings = useCalendarDemoSettings(renderUnluckyDay);

  return (
    <Container edges={[]}>
      <ScrollView>
        <Content pb={40} gap={16}>
          <Row gap={8}>
            <Button
              flex
              size={"small"}
              title={"Настройки"}
              onPress={() => sheet.current?.present()}
            />
            <Button
              flex
              size={"small"}
              appearance={"outline"}
              title={"Список месяцев"}
              onPress={() => navigation.navigate("CalendarListDemo")}
            />
          </Row>

          <Col gap={4}>
            <Text textStyle={"Caption_M3"} color={"textSecondary"}>
              {"Выбрано"}
            </Text>
            <Text textStyle={"Body_S2"}>{settings.selectionText}</Text>
          </Col>

          <Calendar
            ref={calendar}
            animated={settings.animated}
            gestureEnabled={settings.gestureEnabled}
            {...settings.calendarProps}
          />

          <Row gap={8} wrap>
            <Button
              size={"small"}
              title={"Сегодня"}
              onPress={() => calendar.current?.goToToday()}
            />
            <Button
              size={"small"}
              title={"← Месяц"}
              onPress={() => calendar.current?.goToPrevMonth()}
            />
            <Button
              size={"small"}
              title={"Месяц →"}
              onPress={() => calendar.current?.goToNextMonth()}
            />
            <Button
              size={"small"}
              title={"Выбрать 15-е"}
              onPress={() =>
                calendar.current?.select(calendar.current.getMonth().date(15))
              }
            />
            <Button
              size={"small"}
              appearance={"outline"}
              title={"Сброс"}
              onPress={() => calendar.current?.clearSelection()}
            />
          </Row>
        </Content>
      </ScrollView>

      <CalendarSettingsSheet ref={sheet} settings={settings} />
    </Container>
  );
});
