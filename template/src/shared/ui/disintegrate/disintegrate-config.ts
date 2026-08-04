/**
 * Параметры распада — те же, что у нативного `DisintegrationAnimator.Config`
 * (`CAEmitterLayer`), чтобы обе реализации выглядели одинаково.
 */
export interface IDisintegrateConfig {
  /** Шаг сетки, которой снимок разбирается на цвета частиц (точки). */
  sampleGridSize: number;
  /** Сколько частиц рождает одна ячейка сетки. */
  particlesPerCell: number;
  /** Время жизни частицы (сек); разброс — ±40%. */
  lifetime: number;
  /** Сторона частицы (точки). */
  particleSize: number;
  /** Разброс стороны частицы. */
  particleSizeRange: number;
  /** Начальная скорость (точки/сек); разброс — ±50%. */
  velocity: number;
  /** Ускорение вниз (точки/сек²). */
  gravity: number;
  /** Угловая скорость (рад/сек); разброс — ±100%. */
  spin: number;
  /** Время рождения всех частиц (сек). */
  burstDuration: number;
  /**
   * Складывать цвет частиц с фоном (нативный `renderMode = .additive`).
   *
   * Даёт свечение на тёмном фоне и съедает светлые частицы на светлом: сумма
   * упирается в белый, и облако пропадает. Поэтому по умолчанию выключено.
   */
  additive: boolean;
  /**
   * Потолок числа частиц.
   *
   * Нативной системе частиц потолок не нужен — она целиком на GPU. Здесь
   * положение каждой частицы считает воркет на UI-потоке, и цена кадра линейна
   * по их числу.
   */
  maxParticles: number;
  /**
   * Потолок одновременных распадов.
   *
   * Нативному эмиттеру потолок не нужен — там каждое облако само по себе на
   * GPU. Здесь каждое добавляет свой проход по частицам в кадре, а разглядеть
   * больше двух-трёх сразу всё равно нельзя.
   */
  maxConcurrent: number;
}

/**
 * Значения нативного `Config`, кроме двух.
 *
 * `particlesPerCell` там 80, здесь меньше: нативные частицы живут на GPU, а эти
 * пересчитывает воркет. `particleSize` во столько же раз крупнее — облако из
 * вчетверо меньшего числа точек должно закрывать ту же площадь.
 */
export const DISINTEGRATE_DEFAULT_CONFIG: IDisintegrateConfig = {
  sampleGridSize: 20,
  particlesPerCell: 30,
  lifetime: 1.2,
  particleSize: 2,
  particleSizeRange: 1.2,
  velocity: 200,
  gravity: 300,
  spin: 8,
  burstDuration: 0.15,
  additive: false,
  maxParticles: 1200,
  maxConcurrent: 3,
};

/** Полная длительность эффекта: рождение последней частицы плюс её жизнь. */
export const disintegrateTotalDuration = (
  config: IDisintegrateConfig,
): number => config.burstDuration + config.lifetime * 1.4;

const atLeast = (value: number, min: number, fallback: number): number =>
  Number.isFinite(value) && value >= min ? value : fallback;

/**
 * Наложение настроек на умолчания.
 *
 * Конфиг публичный, а его значения идут в деление, границы циклов и размеры
 * массивов: нулевой шаг сетки или отрицательное время жизни уронили бы не
 * эффект, а кадр целиком. Поэтому величины, которыми можно навредить,
 * пропускаются только осмысленными.
 */
export const resolveDisintegrateConfig = (
  config: Partial<IDisintegrateConfig> | undefined,
): IDisintegrateConfig => {
  const merged = { ...DISINTEGRATE_DEFAULT_CONFIG, ...config };
  const defaults = DISINTEGRATE_DEFAULT_CONFIG;

  return {
    ...merged,
    sampleGridSize: atLeast(merged.sampleGridSize, 1, defaults.sampleGridSize),
    particlesPerCell: Math.floor(
      atLeast(merged.particlesPerCell, 1, defaults.particlesPerCell),
    ),
    lifetime: atLeast(merged.lifetime, 0.01, defaults.lifetime),
    particleSize: atLeast(merged.particleSize, 0.1, defaults.particleSize),
    burstDuration: atLeast(merged.burstDuration, 0, defaults.burstDuration),
    maxParticles: Math.floor(
      atLeast(merged.maxParticles, 1, defaults.maxParticles),
    ),
    maxConcurrent: Math.floor(
      atLeast(merged.maxConcurrent, 1, defaults.maxConcurrent),
    ),
  };
};
