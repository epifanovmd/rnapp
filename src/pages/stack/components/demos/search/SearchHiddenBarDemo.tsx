import { NavbarProvider } from "@shared/ui";
import React, { FC, memo } from "react";

import { SearchHiddenBarContent } from "./SearchHiddenBarContent";

/** Демо поиска в закреплённой части скрываемой шапки. */
export const SearchHiddenBarDemo: FC = memo(() => (
  <NavbarProvider>
    <SearchHiddenBarContent />
  </NavbarProvider>
));
