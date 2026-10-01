import { createElement, Fragment } from "react";

import { flattenChildren } from "../flatten-children";

const item = (key: string) => createElement("item", { key });

describe("flattenChildren", () => {
  it("отбрасывает пустые узлы", () => {
    expect(flattenChildren([item("a"), null, false, undefined, item("b")]))
      .toHaveLength(2);
  });

  it("раскрывает вложенные фрагменты", () => {
    const tree = [
      item("a"),
      createElement(
        Fragment,
        { key: "f" },
        item("b"),
        createElement(Fragment, null, item("c"), false),
      ),
    ];

    expect(flattenChildren(tree)).toHaveLength(3);
  });
});
