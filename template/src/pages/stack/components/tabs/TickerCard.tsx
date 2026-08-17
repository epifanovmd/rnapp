import { useTheme } from "@shared/lib/theme";
import { Col, Icon, Row, Text, TIconName } from "@shared/ui";
import React, { FC } from "react";

export interface ITickerCardProps {
  icon: TIconName;
  title: string;
  value: string;
}

export const TickerCard: FC<ITickerCardProps> = ({ icon, title, value }) => {
  const { colors } = useTheme();

  return (
    <Row
      alignItems={"center"}
      gap={8}
      mr={8}
      ph={10}
      pv={8}
      radius={12}
      bg={"onSurface"}
      flex={1}
    >
      <Icon name={icon} size={18} color={colors.primary} />
      <Col flexShrink={1}>
        <Text color={"textSecondary"} textStyle={"Caption_M3"}>
          {title}
        </Text>
        <Text textStyle={"Caption_M2"}>{value}</Text>
      </Col>
    </Row>
  );
};
