import { accumulateToggle } from "../tab-bar-toggle";

describe("accumulateToggle", () => {
  it("копит в одну сторону и переключает после порога", () => {
    expect(accumulateToggle(0, 5, 12)).toEqual({
      accumulated: 5,
      command: "none",
    });
    expect(accumulateToggle(10, 5, 12).command).toBe("hide");
    expect(accumulateToggle(-10, -5, 12).command).toBe("show");
  });

  it("после команды копит заново — не повторяет её на каждом кадре", () => {
    const first = accumulateToggle(10, 5, 12);
    const next = accumulateToggle(first.accumulated, 1, 12);

    expect(first.accumulated).toBe(0);
    expect(next.command).toBe("none");
  });

  it("смена направления копит заново", () => {
    expect(accumulateToggle(8, -3, 12)).toEqual({
      accumulated: -3,
      command: "none",
    });
  });
});
