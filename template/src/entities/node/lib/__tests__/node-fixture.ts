import type { NodeDto } from "@shared/api/gen/main/model";

export const makeNode = (patch: Partial<NodeDto> = {}): NodeDto => ({
  id: "n1",
  name: "node-01",
  description: null,
  host: "203.0.113.10",
  ownerId: null,
  ownerName: null,
  createdById: null,
  createdByName: null,
  agentId: null,
  agentName: null,
  status: "created",
  statusMessage: null,
  agent: null,
  config: { status: "synced", pending: [], failed: [] },
  job: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...patch,
});

export const makeNodeAgent = (
  patch: Partial<NonNullable<NodeDto["agent"]>> = {},
): NonNullable<NodeDto["agent"]> => ({
  id: "a1",
  name: "node-01",
  online: true,
  revoked: false,
  version: "1.1.0",
  address: "203.0.113.10",
  lastSeenAt: 1,
  host: null,
  updateAvailable: false,
  workers: [],
  ...patch,
});
