import { Checkbox, Col, Switch } from "@components";
import { TabProps } from "@core";
import React, { FC, memo, useState } from "react";

export const ElementsTab: FC<TabProps> = memo(({ route }) => {
  const [disabled, setDisabled] = useState(false);
  const [isActive, setIsActive] = useState(false);

  return (
    <Col ph={16} gap={8}>
      <Switch isActive={disabled} onChange={setDisabled} />

      <Switch isActive={isActive} onChange={setIsActive} disabled={disabled} />
      <Checkbox
        isActive={isActive}
        onChange={setIsActive}
        disabled={disabled}
      />
    </Col>
  );
});
