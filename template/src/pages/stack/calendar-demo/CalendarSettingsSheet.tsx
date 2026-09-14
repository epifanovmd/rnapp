import { BottomSheet, Chip, Col, Row, Switch, Text } from "@shared/ui";
import React, { forwardRef } from "react";

import {
  DEMO_MODES,
  DEMO_TOGGLES,
  TCalendarDemoSettings,
} from "./useCalendarDemoSettings";

export interface ICalendarSettingsSheetProps {
  settings: TCalendarDemoSettings;
}

/** Шторка настроек демо: режим выбора и тумблеры видимости/поведения. */
export const CalendarSettingsSheet = forwardRef<
  BottomSheet,
  ICalendarSettingsSheetProps
>(({ settings }, ref) => {
  const { mode, setMode, toggles, setToggle } = settings;

  return (
    <BottomSheet ref={ref}>
      <BottomSheet.Header label={"Настройки"} />
      <BottomSheet.Content>
        <Col pb={24} gap={16}>
          <Col gap={8}>
            <Text textStyle={"Caption_M3"} color={"textSecondary"}>
              {"Режим выбора"}
            </Text>
            <Row gap={8} wrap>
              {DEMO_MODES.map(item => (
                <Chip
                  key={item.mode}
                  text={item.title}
                  isActive={mode === item.mode}
                  onPress={() => setMode(item.mode)}
                />
              ))}
            </Row>
          </Col>

          <Col>
            {DEMO_TOGGLES.map(item => (
              <Row
                key={item.key}
                alignItems={"center"}
                justifyContent={"space-between"}
                pv={6}
              >
                <Text textStyle={"Body_S2"}>{item.title}</Text>
                <Switch
                  isActive={toggles[item.key]}
                  onChange={value => setToggle(item.key, value)}
                />
              </Row>
            ))}
          </Col>
        </Col>
      </BottomSheet.Content>
    </BottomSheet>
  );
});
