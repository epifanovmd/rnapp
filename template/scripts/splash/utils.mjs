export const log = message => console.log(message);

/** Размер в пикселях для плотности экрана. */
export const px = (dp, scale) => Math.max(Math.round(dp * scale), 1);

export const hexToRgb = hex => {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map(c => c + c)
          .join("")
      : value;

  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
};

export const escapeXml = value =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
