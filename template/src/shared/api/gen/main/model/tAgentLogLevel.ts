export type TAgentLogLevel =
  (typeof TAgentLogLevel)[keyof typeof TAgentLogLevel];

export const TAgentLogLevel = {
  debug: "debug",
  info: "info",
  warn: "warn",
  error: "error",
} as const;
