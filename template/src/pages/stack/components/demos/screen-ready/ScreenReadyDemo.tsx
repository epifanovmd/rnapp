import { useNavigation } from "@shared/lib/navigation";
import { screenReadiness } from "@shared/lib/navigation";
import { useNotifications } from "@shared/lib/notifications";
import { Button, NavLink, Text } from "@shared/ui";
import React, { FC, memo, useCallback } from "react";

import { DemoScreen, DemoSection } from "../DemoScreen";

const TARGET = "ComponentsScreenReadyTarget";

/** Демо готовности экрана: хук на тяжёлом экране и ожидание вне React. */
export const ScreenReadyDemo: FC = memo(() => {
  const navigation = useNavigation();
  const toast = useNotifications();

  const openAndWait = useCallback(async () => {
    const startedAt = Date.now();

    navigation.navigate(TARGET);

    const key = await screenReadiness.whenRouteReady(TARGET);

    toast.info(`Готов через ${Date.now() - startedAt} мс`, { title: key });
  }, [navigation, toast]);

  return (
    <DemoScreen>
      <DemoSection
        title={"useScreenReady"}
        description={
          "Тяжёлый контент монтируется, когда экран активен и анимация " +
          "открытия закончилась; до этого — скелетоны"
        }
      >
        <NavLink to={TARGET}>
          <Text color={"textLink"}>{"Открыть тяжёлый экран →"}</Text>
        </NavLink>
        <NavLink to={TARGET} params={{ delay: 800 }}>
          <Text color={"textLink"}>{"С задержкой delay = 800 мс →"}</Text>
        </NavLink>
      </DemoSection>

      <DemoSection
        title={"Вне React"}
        description={
          "screenReadiness.whenRouteReady(name) — промис с ключом экрана; " +
          "так ждут готовности из сервисов и сторов"
        }
      >
        <Button
          title={"Открыть и дождаться"}
          appearance={"outline"}
          onPress={openAndWait}
        />
      </DemoSection>
    </DemoScreen>
  );
});
