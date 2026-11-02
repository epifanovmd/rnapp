import { Row, Text } from "@shared/ui";
import React, { FC } from "react";

export const DialogDemoContent: FC<{ long?: boolean }> = ({ long }) => (
  <>
    {Array.from({ length: long ? 60 : 3 }, (_, index) => (
      <Row key={index}>
        <Text>{`Строка ${index + 1}`}</Text>
      </Row>
    ))}
  </>
);
