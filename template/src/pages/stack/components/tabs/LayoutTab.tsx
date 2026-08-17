import {
  BalancedRow,
  Button,
  Col,
  Collapsable,
  Divider,
  ICollapsableRef,
  Row,
  Text,
} from "@shared/ui";
import React, { FC, memo, useRef, useState } from "react";

import { DemoScreen, DemoSection } from "./DemoScreen";
import { LayoutBox } from "./LayoutBox";

export const LayoutTab: FC = memo(() => {
  const [collapsed, setCollapsed] = useState(true);
  const collapsableRef = useRef<ICollapsableRef>(null);

  return (
    <DemoScreen>
      <DemoSection
        title={"Row / Col"}
        description={"FlexProps-шорткаты: gap, flex, alignItems, отступы"}
      >
        <Row gap={8}>
          <LayoutBox label={"flex 1"} flex={1} />
          <LayoutBox label={"flex 2"} flex={2} />
          <LayoutBox label={"flex 1"} flex={1} />
        </Row>
        <Col gap={8} alignItems={"center"}>
          <LayoutBox label={"center"} />
          <LayoutBox label={"center"} />
        </Col>
      </DemoSection>

      <DemoSection
        title={"BalancedRow"}
        description={"Равномерно распределяет ширину между детьми"}
      >
        <BalancedRow gap={8}>
          <LayoutBox label={"короткий"} />
          <LayoutBox label={"значительно более длинный текст"} />
          <LayoutBox label={"средний блок"} />
        </BalancedRow>
      </DemoSection>

      <DemoSection
        title={"Divider"}
        description={"Горизонтальный, с подписью, вертикальный, цвет/толщина"}
      >
        <Divider />
        <Divider label={"или"} />
        <Divider color={"danger"} thickness={2} inset={32} />
        <Row gap={12} alignItems={"center"}>
          <Text>Слева</Text>
          <Divider vertical />
          <Text>Справа</Text>
        </Row>
      </DemoSection>

      <DemoSection
        title={"Collapsable"}
        description={"Обрезанное превью: контент виден первой строкой"}
      >
        <Button
          title={collapsed ? "Развернуть" : "Свернуть"}
          onPress={() => setCollapsed(current => !current)}
        />
        <Collapsable collapsed={collapsed} collapsedHeight={40}>
          <Text>
            Длинный текст, который в свёрнутом состоянии показывает только
            первую строку-превью, а в развёрнутом — весь блок целиком. Высота
            анимируется на UI-потоке, контент измеряется автоматически —
            фиксированная высота не нужна.
          </Text>
        </Collapsable>
      </DemoSection>

      <DemoSection
        title={"Collapsable: collapsedContent + ref"}
        description={"Кросс-фейд свёрнутого контента, императивный toggle"}
      >
        <Button
          title={"toggle() через ref"}
          onPress={() => collapsableRef.current?.toggle()}
        />
        <Collapsable
          ref={collapsableRef}
          collapsed
          collapsedContent={
            <Text color={"textLink"}>Показать подробности…</Text>
          }
          onAnimationEnd={isCollapsed =>
            console.log("Collapsable animation end, collapsed:", isCollapsed)
          }
        >
          <Text>
            Развёрнутое содержимое. В свёрнутом состоянии вместо него виден
            collapsedContent — компонент сам измеряет его высоту и делает
            кросс-фейд между двумя состояниями.
          </Text>
        </Collapsable>
      </DemoSection>
    </DemoScreen>
  );
});
