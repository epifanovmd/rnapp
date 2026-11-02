/** Лимит длины имени устройства на сервере. */
const DEVICE_NAME_MAX = 100;

/** Base64 без пробелов и переводов строк. */
export const normalizeBase64 = (value: string) => value.replace(/\s+/g, "");

/** Имя устройства для сервера: обрезано до лимита, пустое — запасное. */
export const toDeviceName = (
  name: string | null | undefined,
  fallback: string,
) => {
  const trimmed = (name ?? "").trim().slice(0, DEVICE_NAME_MAX).trim();

  return trimmed || fallback.trim().slice(0, DEVICE_NAME_MAX) || "Mobile";
};
