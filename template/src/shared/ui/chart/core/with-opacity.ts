export const withOpacity = (color: string, opacity: number): string => {
  const clamped = Math.max(0, Math.min(1, opacity));
  const alpha = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, "0");

  return color.length === 7 ? `${color}${alpha}` : color;
};
