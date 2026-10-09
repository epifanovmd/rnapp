import { formatLogEntry, type IAgentLogEntry } from "@entities/agent";
import { Col, Text } from "@shared/ui";
import React, { FC, useRef } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
} from "react-native";

import { monoStyles } from "./mono-style";

interface IAgentLiveLogProps {
  entries: IAgentLogEntry[];
  emptyText: string;
}

/** Расстояние до низа, при котором журнал ещё «прилипает» к новым строкам, px. */
const STICK_DISTANCE = 40;

/** Высота окна живого журнала, px. */
const LOG_HEIGHT = 320;

/** Живой журнал: новые строки внизу; прокрученный вверх — не дёргается. */
export const AgentLiveLog: FC<IAgentLiveLogProps> = ({
  entries,
  emptyText,
}) => {
  const ref = useRef<ScrollView>(null);
  const stick = useRef(true);

  const onScroll = ({
    nativeEvent: { contentOffset, contentSize, layoutMeasurement },
  }: NativeSyntheticEvent<NativeScrollEvent>) => {
    stick.current =
      contentSize.height - contentOffset.y - layoutMeasurement.height <
      STICK_DISTANCE;
  };

  return (
    <Col bg={"onSurface"} radius={12} style={styles.box}>
      <ScrollView
        ref={ref}
        nestedScrollEnabled
        onScroll={onScroll}
        scrollEventThrottle={100}
        onContentSizeChange={() => {
          if (stick.current) ref.current?.scrollToEnd({ animated: false });
        }}
        contentContainerStyle={styles.content}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Text
            textStyle={"Caption_M3"}
            color={entries.length ? "textPrimary" : "textSecondary"}
            style={monoStyles.mono}
            selectable
          >
            {entries.length
              ? entries.map(formatLogEntry).join("\n")
              : emptyText}
          </Text>
        </ScrollView>
      </ScrollView>
    </Col>
  );
};

const styles = StyleSheet.create({
  box: { height: LOG_HEIGHT, overflow: "hidden" },
  content: { padding: 12 },
});
