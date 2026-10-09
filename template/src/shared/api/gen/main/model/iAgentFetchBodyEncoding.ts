/**
 * `utf8` (по умолчанию) | `base64`.
 */
export type IAgentFetchBodyEncoding =
  (typeof IAgentFetchBodyEncoding)[keyof typeof IAgentFetchBodyEncoding];

export const IAgentFetchBodyEncoding = {
  utf8: "utf8",
  base64: "base64",
} as const;
