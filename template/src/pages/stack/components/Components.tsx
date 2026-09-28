import { ScreenProps } from "@shared/lib/navigation";
import { NavbarProvider } from "@shared/ui";
import React, { FC, memo } from "react";

import { ComponentsTabName } from "./components.types";
import { ComponentsNavigator } from "./ComponentsNavigator";

type ComponentsScreenProps = ScreenProps<
  { initialRouteName?: ComponentsTabName } | undefined
>;

export const Components: FC<ComponentsScreenProps> = memo(({ route }) => {
  return (
    <NavbarProvider>
      <ComponentsNavigator initialRouteName={route.params?.initialRouteName} />
    </NavbarProvider>
  );
});
