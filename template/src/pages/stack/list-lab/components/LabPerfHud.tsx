import { useTheme } from "@shared/lib/theme";
import { Text } from "@shared/ui";
import type { IListPerfSnapshot } from "@shared/ui/list";
import { getPerfRates, listPerfSnapshot } from "@shared/ui/list";
import React, { FC, memo, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { LabPerfRow } from "./LabPerfRow";

/** Как часто снимок уходит в разметку, мс. */
const REFRESH_MS = 500;

interface ILabPerfHudProps {
  /** Замер идёт: без него счётчики не собираются и панель пуста. */
  enabled: boolean;
}

/**
 * Панель счётчиков производительности списка.
 *
 * Значения читаются по таймеру, а не по каждому изменению: замер обязан стоить
 * меньше, чем то, что он измеряет.
 */
export const LabPerfHud: FC<ILabPerfHudProps> = memo(({ enabled }) => {
  const { isDark } = useTheme();
  const [snapshot, setSnapshot] = useState<IListPerfSnapshot>();

  useEffect(() => {
    if (!enabled) {
      setSnapshot(undefined);

      return;
    }

    const timer = setInterval(
      () => setSnapshot(listPerfSnapshot()),
      REFRESH_MS,
    );

    return () => clearInterval(timer);
  }, [enabled]);

  if (!snapshot) return null;

  const rates = getPerfRates(snapshot);
  const { counters } = snapshot;

  return (
    <View style={[ss.hud, isDark ? ss.hudDark : ss.hudLight]}>
      <LabPerfRow
        label={"рендеры / раскладки / привязки, в сек"}
        value={`${rates.render} · ${rates.layout} · ${rates.bind}`}
      />
      <LabPerfRow
        label={"пул: контейнеров / создано / промахов"}
        value={`${snapshot.containers} · ${counters.poolNew} · ${counters.poolMiss}`}
      />
      <LabPerfRow
        label={"пустая область: сейчас / худшая, px"}
        value={`${snapshot.blankNow} · ${snapshot.blankMax}`}
      />
      <LabPerfRow
        label={"разрыв события скролла, мс"}
        value={`${snapshot.scrollGapMax}`}
      />
      <LabPerfRow
        label={"измерений / компенсаций"}
        value={`${counters.measure} · ${counters.shift}`}
      />
    </View>
  );
});

LabPerfHud.displayName = "LabPerfHud";

const ss = StyleSheet.create({
  hud: { borderRadius: 10, marginTop: 8, padding: 8 },
  hudDark: { backgroundColor: "#1B1F24" },
  hudLight: { backgroundColor: "#E7EBF0" },
});
