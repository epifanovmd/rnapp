import { Row, Switch, Text } from "@shared/ui";
import React, { FC, memo } from "react";

interface ILabToggleProps {
  title: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

/** Переключатель проверяемого поведения. */
export const LabToggle: FC<ILabToggleProps> = memo(
  ({ title, value, onChange }) => (
    <Row alignItems={"center"} justifyContent={"space-between"} mt={4}>
      <Text textStyle={"Caption_M2"}>{title}</Text>
      <Switch isActive={value} onChange={onChange} />
    </Row>
  ),
);

LabToggle.displayName = "LabToggle";
