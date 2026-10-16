import type { IChatMessage } from "@entities/message";

import { isInputActionOrphaned } from "../chat-input-action";
import { indexMessagesById } from "../chat-rows";

const message = (id: string): IChatMessage => ({
  id,
  content: { kind: "text", text: `текст ${id}` },
  authorId: "u1",
  authorName: "Аня",
  isOwn: true,
  createdAt: 0,
});

describe("isInputActionOrphaned", () => {
  const byId = indexMessagesById([message("m1")]);

  it("ответ или правка удалённого сообщения — сироты", () => {
    expect(isInputActionOrphaned({ type: "edit", messageId: "m2" }, byId)).toBe(
      true,
    );
    expect(
      isInputActionOrphaned({ type: "reply", messageId: "m2" }, byId),
    ).toBe(true);
  });

  it("сообщение на месте или действия нет — не сирота", () => {
    expect(isInputActionOrphaned({ type: "edit", messageId: "m1" }, byId)).toBe(
      false,
    );
    expect(isInputActionOrphaned(null, byId)).toBe(false);
  });
});
