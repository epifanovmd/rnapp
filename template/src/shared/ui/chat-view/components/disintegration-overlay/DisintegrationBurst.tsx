import React, { FC, memo, useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Easing, useSharedValue, withTiming } from "react-native-reanimated";

import { IDisintegrationBurst } from "../chat-overlay-store";
import {
  disintegrationDuration,
  makeParticles,
} from "./disintegration-particles";
import { DisintegrationParticle } from "./DisintegrationParticle";

/** Вспышка на месте одного удалённого пузыря. */

interface IDisintegrationBurstProps {
  burst: IDisintegrationBurst;
  onDone: (key: number) => void;
}

export const DisintegrationBurst: FC<IDisintegrationBurstProps> = memo(
  ({ burst, onDone }) => {
    const progress = useSharedValue(0);

    const particles = useMemo(
      () => makeParticles(burst.frame.width, burst.frame.height),
      [burst.frame.width, burst.frame.height],
    );

    useEffect(() => {
      const totalMs = disintegrationDuration() * 1000;

      progress.value = withTiming(1, {
        duration: totalMs,
        easing: Easing.linear,
      });

      const timeout = setTimeout(() => onDone(burst.key), totalMs + 50);

      return () => clearTimeout(timeout);
    }, [progress, onDone, burst.key]);

    return (
      <View
        pointerEvents="none"
        style={[
          ss.burst,
          {
            left: burst.frame.x,
            top: burst.frame.y,
            width: burst.frame.width,
            height: burst.frame.height,
          },
        ]}
      >
        {particles.map((spec, i) => (
          <DisintegrationParticle
            key={i}
            spec={spec}
            progress={progress}
            color={burst.color}
          />
        ))}
      </View>
    );
  },
);

DisintegrationBurst.displayName = "DisintegrationBurst";

const ss = StyleSheet.create({
  burst: { position: "absolute" },
});
