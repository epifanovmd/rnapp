import type { IChatMessage } from "@entities/message";

import {
  buildChatRows,
  CHAT_DAY_ROW_HEIGHT,
  chatRowFixedSize,
  chatRowKey,
  chatRowType,
  indexMessagesById,
} from "../chat-rows";

const DAY = 24 * 60 * 60 * 1000;

const message = (
  id: string,
  createdAt: number,
  overrides: Partial<IChatMessage> = {},
): IChatMessage => ({
  id,
  content: { kind: "text", text: `текст ${id}` },
  authorId: "u1",
  authorName: "Аня",
  isOwn: false,
  createdAt,
  ...overrides,
});

describe("buildChatRows", () => {
  it("ставит разделитель перед первым сообщением дня", () => {
    const now = new Date("2026-05-12T10:00:00").getTime();
    const { rows, dayIndices } = buildChatRows([
      message("m1", now),
      message("m2", now + 60_000),
      message("m3", now + DAY),
    ]);

    expect(rows.map(row => row.type)).toEqual([
      "day",
      "message",
      "message",
      "day",
      "message",
    ]);
    expect(dayIndices).toEqual([0, 3]);
  });

  it("даёт строкам ключи, не зависящие от индекса", () => {
    const now = new Date("2026-05-12T10:00:00").getTime();
    const { rows } = buildChatRows([message("m1", now)]);

    expect(rows.map(chatRowKey)).toEqual(["day:2026-05-12", "m1"]);
  });

  it("на пустых сообщениях не даёт ни строк, ни якорей", () => {
    expect(buildChatRows([])).toEqual({ rows: [], dayIndices: [] });
  });
});

describe("chatRowType", () => {
  it("разводит виды содержимого по разным контейнерам", () => {
    const now = new Date("2026-05-12T10:00:00").getTime();
    const { rows } = buildChatRows([
      message("m1", now),
      message("m2", now + 60_000, {
        content: { kind: "image", url: "https://example.com/1.jpg" },
      }),
    ]);

    expect(rows.map(chatRowType)).toEqual([
      "day",
      "message:text",
      "message:image",
    ]);
  });
});

describe("chatRowFixedSize", () => {
  it("объявляет высоту разделителя и оставляет сообщения измеряемыми", () => {
    const now = new Date("2026-05-12T10:00:00").getTime();
    const { rows } = buildChatRows([message("m1", now)]);

    expect(rows.map(chatRowFixedSize)).toEqual([
      CHAT_DAY_ROW_HEIGHT,
      undefined,
    ]);
  });
});

describe("indexMessagesById", () => {
  it("адресует сообщения по id", () => {
    const now = new Date("2026-05-12T10:00:00").getTime();
    const target = message("m2", now);

    expect(indexMessagesById([message("m1", now), target]).get("m2")).toBe(
      target,
    );
  });
});
