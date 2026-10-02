import { useNavigation } from "@shared/lib/navigation";
import { Button, Row, ScreenScroll } from "@shared/ui";
import React, { FC, memo } from "react";

import { COMPONENT_DEMOS } from "./component-demos";

/** Плейграунд кита: ссылки на демо-экраны компонентов. */
export const Components: FC = memo(() => {
  const navigation = useNavigation();

  return (
    <ScreenScroll>
      <Row wrap gap={16}>
        {COMPONENT_DEMOS.map(demo => (
          <Button
            key={demo.route}
            appearance={"link"}
            title={demo.title}
            onPress={() => navigation.navigate(demo.route)}
          />
        ))}
      </Row>
    </ScreenScroll>
  );
});
