import { nodeListActionItems } from "../node-actions";

const all = {
  canUpdate: true,
  canDelete: true,
  canAssign: true,
  canProvision: true,
};

describe("nodeListActionItems", () => {
  it("узел без агента: установка, но не удаление агента", () => {
    expect(
      nodeListActionItems({ agentId: null, agent: null }, all).map(i => i.key),
    ).toEqual(["provision", "owner", "edit", "delete"]);
  });

  it("агент на связи: удалить агента можно, ставить заново — нет", () => {
    expect(
      nodeListActionItems(
        { agentId: "a1", agent: { online: true } as never },
        all,
      ).map(i => i.key),
    ).toEqual(["uninstall", "owner", "edit", "delete"]);
  });

  it("без прав — меню пустое", () => {
    expect(
      nodeListActionItems(
        { agentId: null, agent: null },
        {
          canUpdate: false,
          canDelete: false,
          canAssign: false,
          canProvision: false,
        },
      ),
    ).toEqual([]);
  });
});
