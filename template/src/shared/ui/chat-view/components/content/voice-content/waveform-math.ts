/** Подготовка волновой формы: нормализация и ресемплинг амплитуд. */

/** Приводит амплитуды к 0…1 по максимуму: источник может отдавать любую шкалу. */
export const normalizeWaveform = (data: number[]): number[] => {
  let peak = 0;

  for (const value of data) {
    peak = Math.max(peak, Math.abs(value));
  }

  if (peak <= 0) return data.map(() => 0);

  return data.map(value => Math.min(Math.abs(value) / peak, 1));
};

/** Растягивает волну на доступное число столбиков. */
export const resampleWaveform = (data: number[], count: number): number[] => {
  if (data.length === 0) return new Array(count).fill(0.3);

  const result: number[] = new Array(count);

  for (let i = 0; i < count; i++) {
    const idx = (i / count) * data.length;
    const lower = Math.floor(idx);
    const upper = Math.min(lower + 1, data.length - 1);
    const frac = idx - lower;

    result[i] = data[lower] * (1 - frac) + data[upper] * frac;
  }

  return result;
};
