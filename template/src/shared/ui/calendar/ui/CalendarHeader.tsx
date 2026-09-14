import React, { FC, memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "../../text";
import type { ICalendarHeaderProps } from "../calendar.types";
import { useCalendarConfig } from "../context";
import { CalendarNavButton } from "./CalendarNavButton";

export const HEADER_HEIGHT = 44;

/** Шапка календаря: название месяца слева, кнопки «назад»/«вперёд» справа. */
export const CalendarHeader: FC<ICalendarHeaderProps> = memo(props => {
  const {
    title,
    canGoPrev,
    canGoNext,
    onPrev,
    onNext,
    showNavButtons,
    onTitlePress,
    onTitleLongPress,
  } = props;
  const { styles, renderHeaderTitle, renderNavButton } = useCalendarConfig();

  const prevProps = {
    direction: "prev" as const,
    disabled: !canGoPrev,
    onPress: onPrev,
  };
  const nextProps = {
    direction: "next" as const,
    disabled: !canGoNext,
    onPress: onNext,
  };

  return (
    <View style={[SS.header, styles.header]}>
      {renderHeaderTitle ? (
        renderHeaderTitle(props)
      ) : (
        <Pressable
          disabled={!onTitlePress && !onTitleLongPress}
          onPress={onTitlePress}
          onLongPress={onTitleLongPress}
          style={SS.titleBox}
          hitSlop={8}
        >
          <Text
            textStyle={"Title_L"}
            style={[SS.title, styles.headerTitle]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </Pressable>
      )}
      {showNavButtons && (
        <View style={SS.buttons}>
          {renderNavButton ? (
            renderNavButton(prevProps)
          ) : (
            <CalendarNavButton {...prevProps} />
          )}
          {renderNavButton ? (
            renderNavButton(nextProps)
          ) : (
            <CalendarNavButton {...nextProps} />
          )}
        </View>
      )}
    </View>
  );
});

const SS = StyleSheet.create({
  header: {
    height: HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  titleBox: { flex: 1, justifyContent: "center" },
  title: { textTransform: "capitalize" },
  buttons: { flexDirection: "row", gap: 8 },
});
