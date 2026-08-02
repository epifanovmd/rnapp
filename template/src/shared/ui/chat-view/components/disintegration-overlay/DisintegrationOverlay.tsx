import React, { FC, memo, useCallback } from "react";
import { StyleSheet, View } from "react-native";

import { ChatOverlayStore, IChatOverlayState } from "../chat-overlay-store";
import { useOverlayValue } from "../useOverlayValue";
import { DisintegrationBurst } from "./DisintegrationBurst";

/**
 * Эффект распада удалённых пузырей (на Reanimated). Упрощение: цвет частиц
 * берётся из цвета пузыря, а не из пиксельного снапшота.
 */

// Массив пересоздаётся только в addBurst/removeBurst, поэтому годится как снимок.
const selectBursts = (state: IChatOverlayState) => state.bursts;

interface IDisintegrationOverlayProps {
  store: ChatOverlayStore;
}

export const DisintegrationOverlay: FC<IDisintegrationOverlayProps> = memo(
  ({ store }) => {
    const bursts = useOverlayValue(store, selectBursts);

    const handleDone = useCallback(
      (key: number) => store.removeBurst(key),
      [store],
    );

    if (bursts.length === 0) return null;

    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {bursts.map(burst => (
          <DisintegrationBurst
            key={burst.key}
            burst={burst}
            onDone={handleDone}
          />
        ))}
      </View>
    );
  },
);

DisintegrationOverlay.displayName = "DisintegrationOverlay";
