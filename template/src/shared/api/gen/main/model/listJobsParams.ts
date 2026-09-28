import type { EJobRunStatus } from "./eJobRunStatus";

export type ListJobsParams = {
  status?: EJobRunStatus;
  scopeType?: string;
  scopeId?: string;
  offset?: number;
  limit?: number;
};
