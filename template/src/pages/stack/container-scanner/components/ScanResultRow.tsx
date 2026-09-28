import { Row, Text } from "@shared/ui";
import React, { FC, memo } from "react";

export const ScanResultRow: FC<{ label: string; value: string }> = memo(
  ({ label, value }) => (
    <Row mt={12} justifyContent={"space-between"} alignItems={"center"}>
      <Text color={"textSecondary"}>{label}</Text>
      <Text ml={12} flexShrink={1} textAlign={"right"}>
        {value}
      </Text>
    </Row>
  ),
);
