/** base64url(UTF-8) — обратная операция к декодеру в `jwt.ts`. */
const toBase64Url = (value: string): string =>
  btoa(
    encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, hex: string) =>
      String.fromCharCode(parseInt(hex, 16)),
    ),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

/** Собирает JWT с нужным payload; подпись не проверяется. */
export const makeJwt = (payload: Record<string, unknown>): string =>
  `header.${toBase64Url(JSON.stringify(payload))}.signature`;

export const nowSeconds = (): number => Math.floor(Date.now() / 1000);
