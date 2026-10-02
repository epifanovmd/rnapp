import { useScrollReveal } from "@shared/lib/scroll-reveal";
import { ScreenScroll, TRevealPreset, useNavbarReveal } from "@shared/ui";
import React, { FC, memo, useState } from "react";

import { REVEAL_DEMO_DETAILS, REVEAL_DEMO_NAME } from "./reveal-demo-data";
import { ScrollRevealContent } from "./ScrollRevealContent";

/**
 * Демо перехода содержимого в шапку: контроллер — на уровне экрана (он же
 * отдаёт шапку навигатору), якорь — в контенте скролла.
 */
export const ScrollRevealDemo: FC = memo(() => {
  const [preset, setPreset] = useState<TRevealPreset>("slide-up");
  const reveal = useScrollReveal();

  useNavbarReveal({
    progress: reveal.progress,
    title: REVEAL_DEMO_NAME,
    subtitle: REVEAL_DEMO_DETAILS,
    fallbackTitle: "Scroll reveal",
    preset,
    onPress: reveal.scrollToTop,
  });

  return (
    <ScreenScroll>
      <ScrollRevealContent
        reveal={reveal}
        preset={preset}
        onPresetChange={setPreset}
      />
    </ScreenScroll>
  );
});
