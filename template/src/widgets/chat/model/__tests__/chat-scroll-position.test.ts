import { ChatRow } from "../chat-rows";
import {
  chatInitialScroll,
  chatScrollOffset,
  chatScrollStorageKey,
  parseChatScrollPosition,
  serializeChatScrollPosition,
} from "../chat-scroll-position";

const rows: ChatRow[] = [
  { type: "day", key: "day:2026-05-12", dayKey: "2026-05-12" },
  {
    type: "message",
    key: "m1",
    message: {
      id: "m1",
      content: { kind: "text", text: "текст" },
      authorId: "u1",
      authorName: "Аня",
      isOwn: false,
      createdAt: 0,
    },
  },
];

describe("chatScrollStorageKey", () => {
  it("разводит переписки по ключам", () => {
    expect(chatScrollStorageKey("demo")).not.toBe(
      chatScrollStorageKey("other"),
    );
  });
});

describe("parseChatScrollPosition", () => {
  it.each([
    ["строку", { type: "row", key: "m1", offset: -24 } as const],
    ["конец переписки", { type: "end" } as const],
  ])("читает то, что сам записал: %s", (_name, position) => {
    expect(
      parseChatScrollPosition(serializeChatScrollPosition(position)),
    ).toEqual(position);
  });

  it.each([
    ["пусто", null],
    ["не json", "{"],
    ["без вида", JSON.stringify({ key: "m1", offset: 0 })],
    ["без ключа", JSON.stringify({ type: "row", offset: 0 })],
    [
      "смещение не число",
      JSON.stringify({ type: "row", key: "m1", offset: "0" }),
    ],
  ])("не доверяет хранилищу: %s", (_name, raw) => {
    expect(parseChatScrollPosition(raw)).toBeUndefined();
  });
});

describe("chatScrollOffset", () => {
  it("считает смещение строки относительно кромки со знаком", () => {
    // Отрицательное означает, что строка уходит за кромку: именно оно
    // возвращает её ровно тем же куском.
    expect(chatScrollOffset(40, 91)).toBe(-51);
  });

  it("не копит квант нативного смещения из открытия в открытие", () => {
    // Нативное смещение приходит квантованным — на экране 3× это трети точки.
    // Каждый цикл «сохранил — восстановил» добавляет свою треть, и за десяток
    // открытий переписка уезжает на видимую величину.
    const position = 40;
    const quantum = 1 / 3;
    let offset = chatScrollOffset(position, 91 + quantum);

    for (let open = 0; open < 20; open += 1) {
      // Восстановление просит `position - offset`, нативный слой округляет.
      offset = chatScrollOffset(position, position - offset + quantum);
    }

    expect(offset).toBe(-51);
  });
});

describe("chatInitialScroll", () => {
  it("без сохранённой позиции открывает список у последнего сообщения", () => {
    expect(chatInitialScroll(rows, undefined)).toEqual({ type: "end" });
  });

  it("возвращает строку тем же куском, каким она была", () => {
    expect(
      chatInitialScroll(rows, { type: "row", key: "m1", offset: -24 }),
    ).toEqual({
      type: "index",
      index: 1,
      viewOffset: -24,
    });
  });

  it("строки уже нет — открывает список у последнего сообщения", () => {
    expect(
      chatInitialScroll(rows, { type: "row", key: "gone", offset: 0 }),
    ).toEqual({
      type: "end",
    });
  });

  it("от конца переписки возвращает к концу, а не к строке", () => {
    // Низ переписки — не строка, а состояние: там появляются новые сообщения, и
    // сохранённая строка к следующему открытию уже не последняя. Плюс позиция
    // строки считается по оценкам всего, что выше неё, и у глубокой строки
    // ошибка накапливается на сотни точек — список открывается не там.
    expect(chatInitialScroll(rows, { type: "end" })).toEqual({ type: "end" });
  });
});
