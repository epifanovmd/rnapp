import {
  Button,
  Row,
  SwitchTheme,
  TButtonAppearance,
  TButtonVariant,
} from "@shared/ui";
import React, { FC, memo, useCallback, useState } from "react";

import { DemoScreen, DemoSection } from "./DemoScreen";

const VARIANTS: TButtonVariant[] = ["primary", "secondary", "danger"];
const APPEARANCES: TButtonAppearance[] = ["filled", "outline", "ghost"];

export const ButtonsTab: FC = memo(() => {
  const [loading, setLoading] = useState(false);

  const simulateLoading = useCallback(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  }, []);

  return (
    <DemoScreen>
      <DemoSection title={"Тема"}>
        <SwitchTheme />
      </DemoSection>

      {APPEARANCES.map(appearance => (
        <DemoSection
          key={appearance}
          title={`appearance="${appearance}"`}
          description={"Варианты ортогональны исполнению"}
        >
          {VARIANTS.map(variant => (
            <Row key={variant} gap={8}>
              <Button
                flex={1}
                flexBasis={0}
                variant={variant}
                appearance={appearance}
                title={variant}
              />
              <Button
                flex={1}
                flexBasis={0}
                variant={variant}
                appearance={appearance}
                disabled
                title={"disabled"}
              />
            </Row>
          ))}
        </DemoSection>
      ))}

      <DemoSection
        title={"Состояния и контент"}
        description={"loading, иконки, size, переопределение цвета"}
      >
        <Button
          title={loading ? "Загрузка…" : "Запустить loading"}
          loading={loading}
          onPress={simulateLoading}
        />
        <Row gap={8}>
          <Button flex={1} flexBasis={0} size={"small"} title={"small"} />
          <Button
            flex={1}
            flexBasis={0}
            size={"small"}
            appearance={"outline"}
            leftIcon={"search"}
            title={"с иконкой"}
          />
          <Button
            flex={1}
            flexBasis={0}
            size={"small"}
            appearance={"outline"}
            rightIcon={"check"}
            title={"справа"}
          />
        </Row>
        <Button
          appearance={"ghost"}
          color={"warning"}
          title={"ghost с color=warning"}
        />
      </DemoSection>
    </DemoScreen>
  );
});
