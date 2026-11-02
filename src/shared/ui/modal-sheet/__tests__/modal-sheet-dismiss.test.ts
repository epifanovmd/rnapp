import { canDismissModalSheet } from "../modal-sheet-dismiss";

describe("canDismissModalSheet", () => {
  it("без основного действия шторку можно закрыть", () => {
    expect(canDismissModalSheet(undefined)).toBe(true);
  });

  it("пока основное действие выполняется, шторку закрыть нельзя", () => {
    expect(
      canDismissModalSheet({
        title: "Сохранить",
        onPress: jest.fn(),
        loading: true,
      }),
    ).toBe(false);
  });

  it("после завершения действия закрытие снова доступно", () => {
    expect(
      canDismissModalSheet({
        title: "Сохранить",
        onPress: jest.fn(),
        loading: false,
      }),
    ).toBe(true);
  });
});
