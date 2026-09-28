import React, { memo, ReactElement } from "react";
import { StyleSheet, View } from "react-native";

import { Text } from "../../text";
import type { ICalendarDayProps } from "../calendar.types";
import { useCalendarConfig } from "../context";
import { CalendarMarker } from "./CalendarMarker";

/** Равна lineHeight у Caption_M3: свой lineHeight через `style` задать нельзя, textStyle его перекрывает. */
export const DAY_CONTENT_HEIGHT = 16;
const MARKERS_GAP = 3;

/** Контент под числом: подпись, а если её нет — маркеры. Высота фиксированная, чтобы числа в строке стояли ровно. */
const CalendarDayContentImpl = <TExtra,>({
  data,
  isOutside,
  isDisabled,
  hasRowContent,
}: ICalendarDayProps<TExtra>) => {
  const { styles, renderMarker } = useCalendarConfig<TExtra>();

  if (!hasRowContent) return null;

  if (data?.label) {
    return (
      <Text
        textStyle={"Caption_M3"}
        color={isOutside || isDisabled ? "textDisabled" : "textSecondary"}
        numberOfLines={1}
        style={[SS.label, styles.dayLabel]}
      >
        {data.label}
      </Text>
    );
  }

  const markers = data?.markers;

  if (!markers?.length) {
    return <View style={SS.placeholder} />;
  }

  return (
    <View style={[SS.markers, styles.dayMarkers]}>
      {markers.map(({ key: markerKey, ...marker }, index) => {
        const props = { ...marker, index, count: markers.length };
        const key = markerKey ?? String(index);

        return renderMarker ? (
          <React.Fragment key={key}>{renderMarker(props)}</React.Fragment>
        ) : (
          <CalendarMarker key={key} {...props} />
        );
      })}
    </View>
  );
};

export const CalendarDayContent = memo(CalendarDayContentImpl) as <TExtra>(
  props: ICalendarDayProps<TExtra>,
) => ReactElement;

const SS = StyleSheet.create({
  placeholder: { height: DAY_CONTENT_HEIGHT },
  label: { height: DAY_CONTENT_HEIGHT },
  markers: {
    height: DAY_CONTENT_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: MARKERS_GAP,
  },
});
