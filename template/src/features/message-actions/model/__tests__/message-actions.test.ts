import type { IChatMessage } from "@entities/message";

import { buildMessageActions, isMessageActionId } from "../message-actions";

jest.mock("@entities/message", () => ({
  isMessageEditable: (message: { content: { kind: string } }) =>
    message.content.kind === "text",
}));
jest.mock("@shared/ui", () => ({}));

const message = (overrides: Partial<IChatMessage> = {}): IChatMessage => ({
  id: "m1",
  content: { kind: "text", text: "привет" },
  authorId: "u1",
  authorName: "Аня",
  isOwn: true,
  createdAt: 0,
  ...overrides,
});

describe("buildMessageActions", () => {
  it("своё сообщение — ответ, правка и удаление", () => {
    expect(buildMessageActions(message()).map(action => action.id)).toEqual([
      "reply",
      "edit",
      "delete",
    ]);
  });

  it("чужое сообщение — только ответ", () => {
    expect(
      buildMessageActions(message({ isOwn: false })).map(action => action.id),
    ).toEqual(["reply"]);
  });
});

describe("isMessageActionId", () => {
  it("пункты меню сообщения — действия, чужой id — нет", () => {
    for (const action of buildMessageActions(message())) {
      expect(isMessageActionId(action.id)).toBe(true);
    }
    expect(isMessageActionId("forward")).toBe(false);
  });
});
