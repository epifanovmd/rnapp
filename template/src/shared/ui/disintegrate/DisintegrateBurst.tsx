import {
  Atlas,
  Group,
  Skia,
  useColorBuffer,
  useRSXformBuffer,
} from "@shopify/react-native-skia";
import React, { FC, memo, useEffect, useMemo } from "react";
import { Easing, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import {
  IDisintegrateParticles,
  MOTION_BIRTH,
  MOTION_LIFE,
  MOTION_SIZE,
  MOTION_SPIN,
  MOTION_STRIDE,
  MOTION_VX,
  MOTION_VY,
  MOTION_X,
  MOTION_Y,
} from "./disintegrate-particles";
import { particleSprite, SPRITE_SIZE } from "./disintegrate-sprite";

const SPRITE = SPRITE_SIZE;

/**
 * Один распад: облако частиц поверх места, где было содержимое.
 *
 * Все частицы — один вызов `drawAtlas`, то есть одна отрисовка на кадр вне
 * зависимости от их числа. Положение, поворот, размер и альфа пересчитываются
 * в воркетах поверх заранее выделенных буферов: за кадр не создаётся ни одного
 * объекта, и JS-поток не участвует вовсе.
 */
export interface IDisintegrateBurstProps {
  particles: IDisintegrateParticles;
  /** Левый верхний угол исходного содержимого в системе оверлея. */
  x: number;
  y: number;
  /** Полная длительность (сек). */
  duration: number;
  /** Складывать цвет частиц с фоном. */
  additive: boolean;
  /** Свой идентификатор — уходит в `onComplete`, чтобы тот был общим на всех. */
  id: number;
  onComplete: (id: number) => void;
}

/**
 * Мемоизация обязательна, а не для порядка: хуки буферов перезаводят маппер на
 * каждый рендер, перенося в UI-рантайм все частицы заново. Без неё новый распад
 * перезапускал бы анимацию всех уже летящих.
 */
export const DisintegrateBurst: FC<IDisintegrateBurstProps> = memo(
  ({ particles, x, y, duration, additive, id, onComplete }) => {
    const time = useSharedValue(0);

    useEffect(() => {
      time.value = withTiming(
        duration,
        { duration: duration * 1000, easing: Easing.linear },
        finished => {
          if (finished) scheduleOnRN(onComplete, id);
        },
      );
      // Взвод один раз: набор частиц у распада свой и не меняется.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { count, motion, colors, scaleSpeed, alphaSpeed, gravity } =
      particles;

    const transforms = useRSXformBuffer(count, (xform, index) => {
      "worklet";
      const m = index * MOTION_STRIDE;
      const age = time.value - motion[m + MOTION_BIRTH];

      if (age < 0 || age > motion[m + MOTION_LIFE]) {
        xform.set(0, 0, 0, 0);

        return;
      }

      const size = motion[m + MOTION_SIZE] + scaleSpeed * age;

      if (size <= 0) {
        xform.set(0, 0, 0, 0);

        return;
      }

      const scale = size / SPRITE;
      const angle = motion[m + MOTION_SPIN] * age;
      const scos = Math.cos(angle) * scale;
      const ssin = Math.sin(angle) * scale;

      const px = motion[m + MOTION_X] + motion[m + MOTION_VX] * age;
      const py =
        motion[m + MOTION_Y] +
        motion[m + MOTION_VY] * age +
        0.5 * gravity * age * age;

      // RSXform кладёт спрайт углом в точку — сдвигаем на повёрнутую половину,
      // иначе частица вращалась бы вокруг своего угла и уползала.
      const half = SPRITE / 2;

      xform.set(
        scos,
        ssin,
        px - (scos * half - ssin * half),
        py - (ssin * half + scos * half),
      );
    });

    const tints = useColorBuffer(count, (color, index) => {
      "worklet";
      const m = index * MOTION_STRIDE;
      const c = index * 4;
      const age = time.value - motion[m + MOTION_BIRTH];

      color[0] = colors[c];
      color[1] = colors[c + 1];
      color[2] = colors[c + 2];
      // Держать альфу в 0..1 обязательно: Skia переводит цвет в байты без
      // ограничения диапазона и падает на выходе за него. У нерождённой частицы
      // возраст отрицательный, и угасание без зажима подняло бы альфу выше единицы.
      color[3] =
        age < 0 || age > motion[m + MOTION_LIFE]
          ? 0
          : Math.min(1, Math.max(0, colors[c + 3] + alphaSpeed * age));
    });

    // Один прямоугольник на все частицы: атлас читает его по индексу, а
    // источник у них общий — незачем плодить тысячу одинаковых объектов.
    const sprites = useMemo(
      () => new Array(count).fill(Skia.XYWHRect(0, 0, SPRITE, SPRITE)),
      [count],
    );

    // Наличие спрайта провайдер проверил до запуска распада.
    const image = particleSprite();

    return (
      <Group transform={[{ translateX: x }, { translateY: y }]}>
        <Atlas
          image={image}
          sprites={sprites}
          transforms={transforms}
          colors={tints}
          colorBlendMode="modulate"
          blendMode={additive ? "plus" : "srcOver"}
        />
      </Group>
    );
  },
);

DisintegrateBurst.displayName = "DisintegrateBurst";
