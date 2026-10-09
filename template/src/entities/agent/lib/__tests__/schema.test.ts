import { schemaHint, schemaSkeleton } from "../schema";

const schema = {
  type: "object",
  description: "Настройки",
  required: ["prefix"],
  properties: {
    prefix: { type: "string", description: "Префикс ответа" },
    mode: { enum: ["fast", "slow"] },
    limits: { type: "object", properties: { max: { type: "integer" } } },
  },
};

describe("agent schema", () => {
  it("подсказка: поля с типом, обязательностью и вариантами", () => {
    const hint = schemaHint(schema);

    expect(hint?.description).toBe("Настройки");
    expect(hint?.fields.map(field => field.path)).toEqual([
      "prefix",
      "mode",
      "limits",
      "limits.max",
    ]);
    expect(hint?.fields[0]).toMatchObject({ required: true, type: "string" });
    expect(hint?.fields[1]?.options).toEqual(['"fast"', '"slow"']);
    expect(schemaHint("нет")).toBeNull();
  });

  it("заготовка: обязательные поля, default и первое из enum", () => {
    expect(schemaSkeleton(schema)).toEqual({ prefix: "" });
    expect(schemaSkeleton({ type: "integer", default: 3 })).toBe(3);
    expect(schemaSkeleton({ enum: ["a", "b"] })).toBe("a");
    expect(
      schemaSkeleton({
        type: "object",
        properties: { on: { type: "boolean" } },
      }),
    ).toEqual({ on: false });
    expect(schemaSkeleton(undefined)).toEqual({});
  });
});
