import type { AgentDto, IAgentWorkerDto } from "@shared/api/gen/main/model";

export const makeWorker = (
  patch: Partial<IAgentWorkerDto> = {},
): IAgentWorkerDto => ({
  name: "echo",
  state: "running",
  version: "1.0.0",
  release: true,
  health: { ok: true },
  ...patch,
});

export const makeAgent = (patch: Partial<AgentDto> = {}): AgentDto => ({
  id: "a".repeat(32),
  name: "example-node",
  labels: {},
  online: true,
  revoked: false,
  enrolledAt: 1,
  workers: [makeWorker()],
  alerts: [],
  ...patch,
});
