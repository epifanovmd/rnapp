import { initialConfigText, invalidConfigText } from "../config-text";
import type { IWorkerConfigTarget } from "../types";

// Барель сущности тянет UI и нативные модули — подменяем чистыми модулями.
jest.mock("@entities/agent", () => ({
  ...jest.requireActual("@entities/agent/lib/json"),
  ...jest.requireActual("@entities/agent/lib/schema"),
}));

const target = (
  patch: Partial<IWorkerConfigTarget> = {},
): IWorkerConfigTarget => ({
  agentId: "a1",
  worker: "echo",
  key: "settings",
  manifest: {
    key: "settings",
    schema: {
      type: "object",
      required: ["prefix"],
      properties: { prefix: { type: "string" } },
    },
  },
  entry: null,
  ...patch,
});

const status = {
  agentId: "a1",
  worker: "echo",
  key: "settings",
  version: 2,
  state: "applied",
};

describe("worker config text", () => {
  it("ключ не задан — заготовка по схеме", () => {
    expect(initialConfigText(target())).toBe('{\n  "prefix": ""\n}');
  });

  it("задан — значение с сервера; без права значения нет — пусто", () => {
    const config = {
      agentId: "a1",
      worker: "echo",
      key: "settings",
      version: 2,
      updatedAt: 1,
    };

    expect(
      initialConfigText(
        target({
          entry: {
            ...status,
            config: { ...config, data: { prefix: ">" } },
            status,
          },
        }),
      ),
    ).toBe('{\n  "prefix": ">"\n}');
    expect(
      initialConfigText(
        target({ entry: { worker: "echo", key: "settings", config, status } }),
      ),
    ).toBe("");
  });

  it("ошибка схемы — с причиной от сервера", () => {
    expect(
      invalidConfigText("Значение не по схеме", {
        details: { reason: "prefix: ожидалась строка" },
      }),
    ).toBe("Значение не по схеме. prefix: ожидалась строка");
    expect(invalidConfigText("Значение не по схеме", undefined)).toBe(
      "Значение не по схеме",
    );
  });
});
