import { createScrollDriver } from "../scroll-driver";

describe("createScrollDriver", () => {
  it("двигает нативный ScrollView, а не императивный API списка", () => {
    const scrollTo = jest.fn();
    const scrollToOffset = jest.fn();
    const list = { scrollToOffset, getNativeScrollRef: () => ({ scrollTo }) };
    const drive = createScrollDriver(() => list.getNativeScrollRef());

    expect(drive(1200, false)).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({ x: 0, y: 1200, animated: false });
    expect(scrollToOffset).not.toHaveBeenCalled();
  });

  it("без смонтированного ScrollView сообщает, что сдвинуть нечего", () => {
    expect(createScrollDriver(() => null)(100, true)).toBe(false);
  });
});
