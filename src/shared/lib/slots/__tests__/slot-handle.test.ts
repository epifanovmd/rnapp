import type { ReactElement, ReactNode } from "react";
import { createElement } from "react";

import { createCompound } from "../create-compound";
import { slot } from "../slot";

interface IItemProps {
  label?: string;
  children?: ReactNode | ((props: { label?: string }) => ReactNode);
}

const List = createCompound<{ children?: ReactNode }>()({
  name: "List",
  slots: { item: slot<IItemProps>({ multiple: true }) },
  render: ({ slots }) => slots.item.renderAll(),
});

const keysOf = (nodes: ReactNode) =>
  (nodes as ReactElement[]).map(node => node.key);

describe("MultipleSlot.renderAll", () => {
  it("элементы слота без компонента получают ключи", () => {
    const { slots } = List.resolveSlots([
      createElement(List.Item, { key: "a" }, createElement("x")),
      createElement(List.Item, null, createElement("y")),
    ]);

    expect(keysOf(slots.item.renderAll())).toEqual(["a", "1"]);
  });

  it("результат render-функции получает ключ элемента", () => {
    const render = ({ label }: { label?: string }) =>
      createElement("x", null, label);
    const { slots } = List.resolveSlots([
      createElement(List.Item, { label: "one", children: render }),
      createElement(List.Item, { label: "two", children: render }),
    ]);

    expect(keysOf(slots.item.renderAll())).toEqual(["0", "1"]);
  });
});
