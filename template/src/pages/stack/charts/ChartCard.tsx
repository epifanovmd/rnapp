import { useTheme } from "@shared/lib/theme";
import { Text } from "@shared/ui";
import React, { FC, PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

interface IChartCardProps {
  title: string;
  description?: string;
}

/** Карточка примера графика: заголовок, описание и сам график. */
export const ChartCard: FC<PropsWithChildren<IChartCardProps>> = ({
  title,
  description,
  children,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.onSurface }]}>
      <Text textStyle={"Title_M"}>{title}</Text>
      {!!description && (
        <Text textStyle={"Body_S2"} color={"textSecondary"} mb={8}>
          {description}
        </Text>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
});
