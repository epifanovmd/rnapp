import type { INodeAccess } from "../node-access";
import { nodeActionItems } from "../node-actions";

// Барели сущностей тянут UI и нативные модули — подменяем чистыми модулями.
jest.mock("@entities/agent", () =>
  jest.requireActual("@entities/agent/lib/permissions"),
);
jest.mock("@entities/node", () =>
  jest.requireActual("@entities/node/lib/permissions"),
);

const access = (patch: Partial<INodeAccess> = {}): INodeAccess => ({
  canUpdate: true,
  canDelete: true,
  canAssign: true,
  canProvision: true,
  canManage: true,
  canConfig: true,
  canFetch: true,
  canLogs: true,
  ...patch,
});

const state = { agentLive: true, updateAvailable: true, canViewAgents: true };

describe("nodeActionItems", () => {
  it("узел без агента: команда установки и SSH", () => {
    expect(
      nodeActionItems({ agentId: null, agent: null, host: null }, access(), {
        ...state,
        agentLive: false,
      }).map(item => item.key),
    ).toEqual(["installCommand", "installSsh", "edit", "owner", "delete"]);
  });

  it("агент на связи: обновление, ключ, экран агента, удаление агента", () => {
    expect(
      nodeActionItems(
        {
          agentId: "a1",
          agent: { online: true } as never,
          host: "203.0.113.10",
        },
        access(),
        state,
      ).map(item => item.key),
    ).toEqual([
      "updateAgent",
      "rotateKey",
      "agentPage",
      "edit",
      "owner",
      "uninstall",
      "delete",
    ]);
  });

  it("только просмотр — меню пустое", () => {
    expect(
      nodeActionItems(
        { agentId: "a1", agent: { online: true } as never, host: null },
        access({
          canUpdate: false,
          canDelete: false,
          canAssign: false,
          canProvision: false,
          canManage: false,
        }),
        { ...state, canViewAgents: false },
      ),
    ).toEqual([]);
  });
});
