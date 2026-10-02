import { NavbarProvider } from "@shared/ui";
import React, { FC, memo } from "react";

import { TabsDemoNavigator } from "./TabsDemoNavigator";

/** Демо экрана со скрываемой шапкой и закреплёнными вкладками (top-tabs). */
export const TabsDemo: FC = memo(() => (
  <NavbarProvider>
    <TabsDemoNavigator />
  </NavbarProvider>
));
