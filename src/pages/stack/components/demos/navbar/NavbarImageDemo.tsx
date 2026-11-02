import { NavbarProvider } from "@shared/ui";
import React, { FC, memo } from "react";

import { NavbarImageContent } from "./NavbarImageContent";

/** ImageBar: картинка-шапка схлопывается при скролле, на bounce растягивается. */
export const NavbarImageDemo: FC = memo(() => (
  <NavbarProvider>
    <NavbarImageContent />
  </NavbarProvider>
));
