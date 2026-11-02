import { Text } from "@shared/ui";
import React, { FC, Ref, useImperativeHandle, useState } from "react";
import { StyleSheet, View } from "react-native";

/** Обновление подписей извне — без перерисовки графика-родителя. */
export interface IRevenueStatusHandle {
  setRange: (text: string) => void;
  setTouch: (text: string) => void;
  setPoint: (text: string) => void;
}

interface IRevenueStatusProps {
  ref?: Ref<IRevenueStatusHandle>;
}

/**
 * Подписи под графиком (окно, касание, активные точки) со своим состоянием:
 * смена точки на скрабе перерисовывает только их, а не весь график.
 */
export const RevenueStatus: FC<IRevenueStatusProps> = ({ ref }) => {
  const [range, setRange] = useState("");
  const [touch, setTouch] = useState("Not touching");
  const [point, setPoint] = useState("Hold over the chart");

  useImperativeHandle(ref, () => ({ setRange, setTouch, setPoint }), []);

  return (
    <View style={styles.status}>
      {!!range && (
        <Text textStyle={"Body_S2"} color={"textSecondary"}>
          {range}
        </Text>
      )}
      <Text textStyle={"Body_S2"} color={"textSecondary"}>
        {touch}
      </Text>
      <Text textStyle={"Body_S2"} color={"textSecondary"}>
        {point}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  status: {
    gap: 4,
    marginTop: 8,
  },
});
