import { nodeAccess } from "../node-access";

// Барели сущностей тянут UI и нативные модули — подменяем чистыми модулями.
jest.mock("@entities/agent", () =>
  jest.requireActual("@entities/agent/lib/permissions"),
);
jest.mock("@entities/node", () =>
  jest.requireActual("@entities/node/lib/permissions"),
);

const grant =
  (...perms: string[]) =>
  (permission: string) =>
    perms.includes(permission);

describe("nodeAccess", () => {
  it("агент узла — по праву узла", () => {
    expect(
      nodeAccess({
        canOnNode: grant("node:agent", "node:logs"),
        canAgents: grant(),
      }),
    ).toMatchObject({
      canManage: true,
      canConfig: true,
      canFetch: true,
      canLogs: true,
      canUpdate: false,
    });
  });

  it("или по правам раздела агентов — каждое своё", () => {
    expect(
      nodeAccess({
        canOnNode: grant("node:update"),
        canAgents: grant("agent:config"),
      }),
    ).toMatchObject({
      canManage: false,
      canConfig: true,
      canFetch: false,
      canLogs: false,
      canUpdate: true,
    });
  });
});
