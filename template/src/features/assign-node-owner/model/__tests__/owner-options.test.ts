import { fallbackOwnerOptions, uniqueOptions } from "../owner-options";

describe("owner options", () => {
  it("без списка пользователей — текущий владелец и сам пользователь", () => {
    expect(
      fallbackOwnerOptions(
        { ownerId: "u2", ownerName: "Анна" },
        { id: "u1", email: "me@example.com" },
      ),
    ).toEqual([
      { value: "u2", label: "Анна" },
      { value: "u1", label: "me@example.com (вы)" },
    ]);
    expect(fallbackOwnerOptions(null, { id: "u1", email: null })).toEqual([
      { value: "u1", label: "Вы" },
    ]);
  });

  it("владелец — сам пользователь: одна запись с «(вы)»", () => {
    expect(
      fallbackOwnerOptions(
        { ownerId: "u1", ownerName: "Я" },
        { id: "u1", email: "me@example.com" },
      ),
    ).toEqual([{ value: "u1", label: "me@example.com (вы)" }]);
  });

  it("повторы по id убираются", () => {
    expect(
      uniqueOptions([
        { value: "u1", label: "Я" },
        { value: "u1", label: "Пользователь" },
        { value: "u2", label: "Анна" },
      ]),
    ).toEqual([
      { value: "u1", label: "Я" },
      { value: "u2", label: "Анна" },
    ]);
  });
});
