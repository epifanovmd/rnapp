import { Button } from "@components";
import { useWizardContext } from "@force-dev/react";
import { Col, Row } from "@force-dev/react-mobile";
import React, { FC, memo } from "react";

export const WizardFooter: FC = memo(() => {
  const { form, prevStep, nextStep, handleReset, step } = useWizardContext();

  return (
    <Col>
      <Row>
        <Button onPress={prevStep} disabled={step === 0}>
          {"Prev"}
        </Button>
        <Button onPress={nextStep} disabled={!form.formState.isValid}>
          {"Next"}
        </Button>
        <Button
          onPress={() => {
            form.reset();
          }}
        >
          {"Rest"}
        </Button>
        <Button onPress={handleReset}>{"Rest all"}</Button>
      </Row>
    </Col>
  );
});
