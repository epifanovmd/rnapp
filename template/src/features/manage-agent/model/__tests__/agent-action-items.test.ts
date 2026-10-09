import { agentActionItems } from "../agent-action-items";

describe("agentActionItems", () => {
  it("по правам и состоянию агента", () => {
    expect(
      agentActionItems({
        updateTo: "1.2.0",
        canRotate: true,
        canRevoke: true,
        canDelete: false,
      }).map(item => item.key),
    ).toEqual(["update", "rotate", "revoke"]);
    expect(
      agentActionItems({
        updateTo: null,
        canRotate: false,
        canRevoke: false,
        canDelete: true,
      }).map(item => item.key),
    ).toEqual(["delete"]);
  });
});
