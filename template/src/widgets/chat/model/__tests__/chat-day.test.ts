import { formatChatDay, messageDayKey } from "../chat-day";

const at = (iso: string) => new Date(iso).getTime();

describe("messageDayKey", () => {
  it("собирает сообщения одних суток под один ключ", () => {
    expect(messageDayKey(at("2026-05-12T00:01:00"))).toBe(
      messageDayKey(at("2026-05-12T23:59:00")),
    );
  });

  it("разводит соседние сутки", () => {
    expect(messageDayKey(at("2026-05-12T23:59:00"))).not.toBe(
      messageDayKey(at("2026-05-13T00:01:00")),
    );
  });
});

describe("formatChatDay", () => {
  const now = at("2026-05-12T10:00:00");

  it.each([
    ["2026-05-12", "Сегодня"],
    ["2026-05-11", "Вчера"],
    ["2026-05-09", "09.05.2026"],
  ])("подписывает %s как %s", (dayKey, expected) => {
    expect(formatChatDay(dayKey, now)).toBe(expected);
  });
});
