import { Row, Text } from "@shared/ui";
import React, { FC } from "react";

export const SheetDemoContent: FC<{ count?: number }> = ({ count = 40 }) => (
  <>
    {Array.from({ length: count }, (_, index) => (
      <Row key={index}>
        <Text>{`Строка ${index + 1}`}</Text>
      </Row>
    ))}
  </>
);
