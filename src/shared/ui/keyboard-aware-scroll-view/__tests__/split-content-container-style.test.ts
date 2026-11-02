import { splitContentContainerStyle } from "../split-content-container-style";

describe("splitContentContainerStyle", () => {
  it("отступы и gap уходят в обёртку детей — после распорки отступов нет", () => {
    const style = { paddingHorizontal: 16, paddingBottom: 40, gap: 24 };

    expect(splitContentContainerStyle(style)).toEqual({
      container: undefined,
      content: style,
    });
  });

  it("flexGrow остаётся и у контейнера, и у обёртки — дети тянутся как раньше", () => {
    const style = { flexGrow: 1, justifyContent: "center" as const };

    expect(splitContentContainerStyle(style)).toEqual({
      container: { flexGrow: 1 },
      content: style,
    });
  });

  it("без стиля — ничего", () => {
    expect(splitContentContainerStyle(undefined)).toEqual({
      container: undefined,
      content: undefined,
    });
  });
});
