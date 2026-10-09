import type { TAgentWorkerName } from "./tAgentWorkerName";

export type GetAgentLogsParams = {
  worker?: TAgentWorkerName;
  lines?: number;
};
