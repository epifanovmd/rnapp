import { resolveScrollEdge } from "../bar-scroll-edge";

describe("resolveScrollEdge", () => {
  it("у верхней границы и на перелёте сверху — верх (панель показана)", () => {
    expect(resolveScrollEdge(0, 0, 0, 800)).toBe("top");
    expect(resolveScrollEdge(-30, 30, 0, 800)).toBe("top");
  });

  it("на перелёте снизу прокручиваемого контента — низ (панель скрыта)", () => {
    expect(resolveScrollEdge(840, 0, 40, 800)).toBe("bottom");
  });

  it("в середине — край не решает", () => {
    expect(resolveScrollEdge(300, 0, 0, 800)).toBeNull();
  });

  it("контент не прокручивается — bounce в любую сторону не прячет панель", () => {
    // Контент короче экрана: maxOffset 0, протяжка вверх даёт перелёт снизу.
    expect(resolveScrollEdge(40, 0, 40, 0)).toBe("top");
    expect(resolveScrollEdge(-40, 40, 0, 0)).toBe("top");
  });
});
