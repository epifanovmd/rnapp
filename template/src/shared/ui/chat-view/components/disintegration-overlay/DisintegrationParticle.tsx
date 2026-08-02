import React, { FC, memo } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import {
  DISINTEGRATION_GRAVITY,
  disintegrationDuration,
  IParticleSpec,
} from "./disintegration-particles";

/** Одна частица: баллистика и затухание считаются на UI-потоке от общего прогресса. */

interface IDisintegrationParticleProps {
  spec: IParticleSpec;
  /** Общий прогресс вспышки 0..1 — один на все частицы одного пузыря. */
  progress: SharedValue<number>;
  color: string;
}

export const DisintegrationParticle: FC<IDisintegrationParticleProps> = memo(
  ({ spec, progress, color }) => {
    const style = useAnimatedStyle(() => {
      const t = progress.value * disintegrationDuration();
      const life = Math.min(1, t / spec.lifetime);

      return {
        opacity: spec.opacity * Math.max(0, 1 - life),
        transform: [
          { translateX: spec.x0 + spec.vx * t },
          {
            translateY:
              spec.y0 + spec.vy * t + (DISINTEGRATION_GRAVITY * t * t) / 2,
          },
          { rotate: `${spec.spin * t}rad` },
          { scale: Math.max(0.1, 1 - life * 0.8) },
        ],
      };
    });

    return (
      <Animated.View
        style={[
          ss.particle,
          { width: spec.size, height: spec.size, backgroundColor: color },
          style,
        ]}
      />
    );
  },
);

DisintegrationParticle.displayName = "DisintegrationParticle";

const ss = StyleSheet.create({
  particle: { position: "absolute", left: 0, top: 0 },
});
