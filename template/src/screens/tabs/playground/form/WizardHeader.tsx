import { Text } from "@components";
import { useWizardContext } from "@force-dev/react";
import { Col } from "@force-dev/react-mobile";
import React, { FC, memo } from "react";

export const WizardHeader: FC = memo(() => {
  const { values, step } = useWizardContext();

  return (
    <Col>
      <Text>{`Current step: ${step}`}</Text>
    </Col>
  );
});
