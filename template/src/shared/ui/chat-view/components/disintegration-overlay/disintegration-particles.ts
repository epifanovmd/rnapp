/**
 * Параметры частиц эффекта распада — порт `DisintegrationAnimator.Config`
 * (lifetime 1.2 с, velocity 200, gravity 300, spin 8).
 */

export const DISINTEGRATION_LIFETIME = 1.2;
export const DISINTEGRATION_GRAVITY = 300;

const VELOCITY = 200;
const SPIN = 8;
const PARTICLE_COUNT = 64;

export interface IParticleSpec {
  x0: number;
  y0: number;
  vx: number;
  vy: number;
  spin: number;
  size: number;
  lifetime: number;
  opacity: number;
}

/** Полное время жизни вспышки с запасом на разброс времён частиц (сек). */
export const disintegrationDuration = (): number =>
  DISINTEGRATION_LIFETIME + DISINTEGRATION_LIFETIME * 0.4;

/** Случайный разлёт частиц по площади пузыря. */
export const makeParticles = (
  width: number,
  height: number,
): IParticleSpec[] => {
  const particles: IParticleSpec[] = new Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = VELOCITY * (0.5 + Math.random());

    particles[i] = {
      x0: Math.random() * width,
      y0: Math.random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      spin: (Math.random() * 2 - 1) * SPIN,
      size: 2 + Math.random() * 3,
      lifetime: DISINTEGRATION_LIFETIME * (0.6 + Math.random() * 0.8),
      opacity: 0.35 + Math.random() * 0.65,
    };
  }

  return particles;
};
