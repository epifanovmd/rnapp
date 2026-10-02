import { ScreenScroll } from "@shared/ui";
import React, { FC, memo } from "react";

import { ScrollRevealContent } from "./ScrollRevealContent";

/**
 * Демо перехода содержимого в шапку: якорь меряется внутри ScreenScroll,
 * поэтому хук — в дочернем компоненте, под контекстом скролла.
 */
export const ScrollRevealDemo: FC = memo(() => (
  <ScreenScroll>
    <ScrollRevealContent />
  </ScreenScroll>
));
