import { Text } from "@shared/ui";
import React, { FC, memo } from "react";

interface ILabStatusProps {
  text: string;
}

/** Строка состояния: значения, за которыми наблюдают в тесте. */
export const LabStatus: FC<ILabStatusProps> = memo(({ text }) => (
  <Text textStyle={"Caption_M2"} color={"textSecondary"} mt={4}>
    {text}
  </Text>
));

LabStatus.displayName = "LabStatus";
