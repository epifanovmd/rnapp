export const clamp = (value: number, min: number, max: number): number => {
  "worklet";

  return Math.min(Math.max(value, min), max);
};

export const normalizeCarouselIndex = (
  index: number,
  count: number,
  loop: boolean,
): number => {
  "worklet";

  if (count <= 0) {
    return 0;
  }

  return loop ? ((index % count) + count) % count : clamp(index, 0, count - 1);
};

/** Кратчайшее циклическое смещение progress относительно index. */
export const getRelativeProgress = (
  progress: number,
  index: number,
  count: number,
  loop: boolean,
): number => {
  "worklet";

  const offset = progress - index;

  if (!loop || count <= 0) {
    return offset;
  }

  return offset - count * Math.round(offset / count);
};
