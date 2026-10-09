import { nodeAddressMismatch } from "../address";
import { makeNode, makeNodeAgent } from "./node-fixture";

describe("nodeAddressMismatch", () => {
  it("IP узла не совпадает с адресом агента", () => {
    expect(
      nodeAddressMismatch(
        makeNode({ agent: makeNodeAgent({ address: "198.51.100.7" }) }),
      ),
    ).toBe(true);
    expect(
      nodeAddressMismatch(
        makeNode({ agent: makeNodeAgent({ address: "203.0.113.10:51820" }) }),
      ),
    ).toBe(false);
  });

  it("имя хоста или нет адреса — не сравниваем", () => {
    expect(
      nodeAddressMismatch(
        makeNode({ host: "node.example.com", agent: makeNodeAgent() }),
      ),
    ).toBe(false);
    expect(nodeAddressMismatch(makeNode())).toBe(false);
  });
});
