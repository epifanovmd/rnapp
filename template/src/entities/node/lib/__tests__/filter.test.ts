import { filterNodes } from "../filter";
import { makeNode } from "./node-fixture";

const nodes = [
  makeNode({ id: "1", name: "alpha", ownerId: "u1" }),
  makeNode({
    id: "2",
    name: "beta",
    host: "node.example.com",
    createdById: "u1",
  }),
  makeNode({ id: "3", name: "gamma", description: "резервный", host: null }),
];

describe("filterNodes", () => {
  it("поиск по названию, адресу и описанию без учёта регистра", () => {
    const ids = (query: string) =>
      filterNodes(nodes, { query, mine: false }, null).map(node => node.id);

    expect(ids("ALP")).toEqual(["1"]);
    expect(ids("example")).toEqual(["2"]);
    expect(ids("резерв")).toEqual(["3"]);
    expect(ids("  ")).toEqual(["1", "2", "3"]);
  });

  it("«Мои» — владелец или создатель; без пользователя — пусто", () => {
    expect(
      filterNodes(nodes, { query: "", mine: true }, "u1").map(node => node.id),
    ).toEqual(["1", "2"]);
    expect(filterNodes(nodes, { query: "", mine: true }, null)).toEqual([]);
  });
});
