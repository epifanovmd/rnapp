import { Col, RadioGroup, Spinner, Text } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";

import {
  PRIVACY_FIELDS,
  PRIVACY_OPTIONS,
  usePrivacyVM,
} from "../model/usePrivacyVM";

export const PrivacySettingsForm: FC = observer(() => {
  const { privacy, isLoading, change } = usePrivacyVM();

  if (isLoading || !privacy) return <Spinner size={24} />;

  return (
    <Col gap={16}>
      {PRIVACY_FIELDS.map(({ key, label }) => (
        <Col key={key} gap={8}>
          <Text textStyle={"Body_M1"}>{label}</Text>
          <RadioGroup
            horizontal={true}
            options={PRIVACY_OPTIONS}
            value={privacy[key]}
            onChange={value => change(key, value)}
          />
        </Col>
      ))}
    </Col>
  );
});
