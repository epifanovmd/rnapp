import { ScreenProps } from "@shared/lib/navigation";
import { TransitionProvider } from "@shared/lib/transition";
import React, { FC, memo } from "react";

import { ComponentsTabName } from "./components.types";
import { ComponentsNavigator } from "./ComponentsNavigator";

type ComponentsScreenProps = ScreenProps<
  { initialRouteName?: ComponentsTabName } | undefined
>;

export const Components: FC<ComponentsScreenProps> = memo(({ route }) => {
  return (
    <TransitionProvider>
      <ComponentsNavigator initialRouteName={route.params?.initialRouteName} />
    </TransitionProvider>
  );
});
