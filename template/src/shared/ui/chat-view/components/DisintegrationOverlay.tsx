import React, { FC, memo, useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import {
  ChatOverlayStore,
  IChatOverlayState,
  IDisintegrationBurst,
} from "./chat-overlay-store";
import { useOverlayValue } from "./useOverlayValue";

/**
 * Порт DisintegrationAnimator (CAEmitterLayer → Reanimated): пузырь
 * «рассыпается» на частицы с разлётом, гравитацией, вращением и затуханием.
 * Значения конфига — из DisintegrationAnimator.Config.default
 * (lifetime 1.2s, velocity 200, gravity 300, spin 8, burst 0.15s).
 * Упрощение порта: цвет частиц берётся из цвета пузыря, а не пиксельного
 * снапшота.
 */

const LIFETIME = 1.2;
const VELOCITY = 200;
const GRAVITY = 300;
const SPIN = 8;
const PARTICLE_COUNT = 64;

interface IParticleSpec {
  x0: number;
  y0: number;
  vx: number;
  vy: number;
  spin: number;
  size: number;
  lifetime: number;
  opacity: number;
}

const makeParticles = (width: number, height: number): IParticleSpec[] => {
  const particles: IParticleSpec[] = [];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = VELOCITY * (0.5 + Math.random());

    particles.push({
      x0: Math.random() * width,
      y0: Math.random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      spin: (Math.random() * 2 - 1) * SPIN,
      size: 2 + Math.random() * 3,
      lifetime: LIFETIME * (0.6 + Math.random() * 0.8),
      opacity: 0.35 + Math.random() * 0.65,
    });
  }

  return particles;
};

const Particle: FC<{
  spec: IParticleSpec;
  progress: SharedValue<number>;
  color: string;
}> = memo(({ spec, progress, color }) => {
  const style = useAnimatedStyle(() => {
    const t = progress.value * (LIFETIME + LIFETIME * 0.4);
    const life = Math.min(1, t / spec.lifetime);

    return {
      opacity: spec.opacity * Math.max(0, 1 - life),
      transform: [
        { translateX: spec.x0 + spec.vx * t },
        { translateY: spec.y0 + spec.vy * t + (GRAVITY * t * t) / 2 },
        { rotate: `${spec.spin * t}rad` },
        { scale: Math.max(0.1, 1 - life * 0.8) },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        ss.particle,
        {
          width: spec.size,
          height: spec.size,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
});

Particle.displayName = "Particle";

const Burst: FC<{ burst: IDisintegrationBurst; onDone: () => void }> = memo(
  ({ burst, onDone }) => {
    const progress = useSharedValue(0);

    const particles = useMemo(
      () => makeParticles(burst.frame.width, burst.frame.height),
      [burst.frame.width, burst.frame.height],
    );

    useEffect(() => {
      const totalMs = (LIFETIME + LIFETIME * 0.4) * 1000;

      progress.value = withTiming(1, {
        duration: totalMs,
        easing: Easing.linear,
      });

      const timeout = setTimeout(onDone, totalMs + 50);

      return () => clearTimeout(timeout);
    }, [progress, onDone]);

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
          <Particle
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

Burst.displayName = "Burst";

interface IDisintegrationOverlayProps {
  store: ChatOverlayStore;
}

// Массив пересоздаётся только в addBurst/removeBurst, поэтому годится как
// снимок: остальные обновления стора (FAB, плашка даты) оверлей не трогают.
const selectBursts = (state: IChatOverlayState) => state.bursts;

export const DisintegrationOverlay: FC<IDisintegrationOverlayProps> = memo(
  ({ store }) => {
    const bursts = useOverlayValue(store, selectBursts);

    if (bursts.length === 0) return null;

    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {bursts.map(burst => (
          <Burst
            key={burst.key}
            burst={burst}
            onDone={() => store.removeBurst(burst.key)}
          />
        ))}
      </View>
    );
  },
);

DisintegrationOverlay.displayName = "DisintegrationOverlay";

const ss = StyleSheet.create({
  particle: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  burst: {
    position: "absolute",
  },
});
