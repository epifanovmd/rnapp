import { nodeFormBody, nodeFormSchema } from "../validation";

describe("node form", () => {
  it("адрес — имя хоста или IP; пустой допустим", () => {
    const parse = (host: string) =>
      nodeFormSchema.safeParse({ name: "node-01", host, description: "" })
        .success;

    expect(parse("203.0.113.10")).toBe(true);
    expect(parse("node.example.com")).toBe(true);
    expect(parse("2001:db8::1")).toBe(true);
    expect(parse("")).toBe(true);
    expect(parse("node example")).toBe(false);
  });

  it("пустые адрес и описание уходят как null", () => {
    expect(
      nodeFormBody(
        nodeFormSchema.parse({ name: " node-01 ", host: " ", description: "" }),
      ),
    ).toEqual({ name: "node-01", host: null, description: null });
  });
});
