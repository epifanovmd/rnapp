import { TabProps } from "@shared/lib/navigation";
import { useTransition } from "@shared/lib/transition";
import { Checkbox, Col, Switch, SwitchTheme } from "@shared/ui";
import React, { FC, memo, useState } from "react";

export const ElementsTab: FC<TabProps> = memo(({ route }) => {
  const [disabled, setDisabled] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const { navbarHeight } = useTransition();

  return (
    <Col ph={16} gap={8} pt={navbarHeight}>
      <SwitchTheme />
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
