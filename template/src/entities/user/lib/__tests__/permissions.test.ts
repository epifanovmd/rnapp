import { KnownRole } from "@shared/api/gen/main/model";

import { hasPermission, ownPermission, resolveScope } from "../permissions";

describe("hasPermission", () => {
  it("учитывает wildcard-иерархию и полный доступ", () => {
    expect(hasPermission(["file:*"], "file:delete")).toBe(true);
    expect(hasPermission(["*"], "file:delete")).toBe(true);
    expect(hasPermission(["file:view"], "file:delete")).toBe(false);
  });

  it("право на все покрывает то же право на свои", () => {
    expect(hasPermission(["file:view"], "file:view:own")).toBe(true);
    expect(hasPermission(["file:*"], "file:view:own")).toBe(true);
    expect(hasPermission(["file:view"], "file:delete:own")).toBe(false);
  });

  it("право на свои не даёт права на все", () => {
    expect(hasPermission(["file:view:own"], "file:view")).toBe(false);
  });
});

describe("resolveScope", () => {
  it("all — право, wildcard или роль admin", () => {
    expect(resolveScope([], ["file:view"], "file:view")).toBe("all");
    expect(resolveScope([], ["file:*"], "file:view")).toBe("all");
    expect(resolveScope([KnownRole.admin], [], "file:view")).toBe("all");
  });

  it("own — только право на свои", () => {
    expect(resolveScope([], [ownPermission("file:view")], "file:view")).toBe(
      "own",
    );
  });

  it("null — права нет", () => {
    expect(resolveScope([], ["jobs:demo"], "file:view")).toBeNull();
  });
});
