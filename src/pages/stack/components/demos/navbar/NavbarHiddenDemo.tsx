import { NavbarProvider } from "@shared/ui";
import React, { FC, memo } from "react";

import { NAVBAR_DEMO_ROWS } from "./navbar-demo-data";
import { NavbarHiddenContent } from "./NavbarHiddenContent";

/**
 * Низкая скрываемая шапка: за порогом (контент прокручен на её высоту)
 * прячется и показывается по направлению жеста, доезжает после отпускания.
 */
export const NavbarHiddenDemo: FC = memo(() => (
  <NavbarProvider>
    <NavbarHiddenContent title={"Hidden bar"} rows={NAVBAR_DEMO_ROWS} />
  </NavbarProvider>
));
