import { TransitionProvider } from "@shared/lib/transition";
import React, { FC, memo } from "react";

import { ListLabNavigator } from "./ListLabNavigator";

/** Набор стендов для проверки поведения списка. */
export const ListLab: FC = memo(() => (
  <TransitionProvider>
    <ListLabNavigator />
  </TransitionProvider>
));

ListLab.displayName = "ListLab";
