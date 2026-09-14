import "dayjs/locale/ru";

import {
  Button,
  CalendarList,
  Container,
  Row,
  Text,
  useBottomSheetRef,
  useCalendarRef,
} from "@shared/ui";
import dayjs from "dayjs";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CalendarSettingsSheet } from "./CalendarSettingsSheet";
import { renderUnluckyDay } from "./UnluckyDay";
import { useCalendarDemoSettings } from "./useCalendarDemoSettings";

export const CalendarListDemo: FC = observer(() => {
  const { bottom } = useSafeAreaInsets();
  const list = useCalendarRef();
  const sheet = useBottomSheetRef();
  const settings = useCalendarDemoSettings(renderUnluckyDay, {
    showOutsideDays: false,
  });

  return (
    <Container edges={[]}>
      <Row ph={8} pv={8} gap={8} wrap>
        <Button
          size={"small"}
          title={"Настройки"}
          onPress={() => sheet.current?.present()}
        />
        <Button
          size={"small"}
          appearance={"outline"}
          title={"Сегодня"}
          onPress={() => list.current?.goToToday()}
        />
        <Button
          size={"small"}
          appearance={"outline"}
          title={"+3 мес"}
          onPress={() => list.current?.goToMonth(dayjs().add(3, "month"))}
        />
        <Button
          size={"small"}
          appearance={"outline"}
          title={"−6 мес"}
          onPress={() => list.current?.goToMonth(dayjs().subtract(6, "month"))}
        />
        <Button
          size={"small"}
          appearance={"ghost"}
          title={"Сброс"}
          onPress={() => list.current?.clearSelection()}
        />
      </Row>
      <Text ph={8} textStyle={"Body_S2"} color={"textSecondary"}>
        {settings.selectionText}
      </Text>

      <CalendarList
        ref={list}
        {...settings.calendarProps}
        showMonthTitles={settings.showMonthTitles}
        pastMonths={24}
        futureMonths={24}
        contentContainerStyle={{ paddingBottom: bottom }}
      />

      <CalendarSettingsSheet ref={sheet} settings={settings} />
    </Container>
  );
});
