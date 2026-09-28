import type { ReactElement, ReactNode } from "react";
import React from "react";

import type {
  AnyProps,
  ResolveContext,
  SlotValue,
  SlotValues,
  Tagged,
} from "./slot-meta";
import { isDev, matchSlotEntry, SLOT_META } from "./slot-meta";
import { assertOwnSlot, assertSingleValue } from "./slot-validate";

/**
 * Обход детей вместо `React.Children.forEach`: тот аллоцирует массив
 * результата и строит строковые ключи на каждого ребёнка. Пустые узлы
 * (`null`/`undefined`/`boolean`) отбрасываются, а не превращаются в `null`.
 */
export const eachChild = (
  nodes: ReactNode,
  visit: (node: ReactNode) => void,
) => {
  if (nodes === null || nodes === undefined || typeof nodes === "boolean") {
    return;
  }

  if (Array.isArray(nodes)) {
    for (const node of nodes) {
      eachChild(node, visit);
    }

    return;
  }

  if (typeof nodes === "object" && Symbol.iterator in nodes) {
    for (const node of nodes as Iterable<ReactNode>) {
      eachChild(node, visit);
    }

    return;
  }

  visit(nodes);
};

/**
 * JSX-стратегия: слоты ищутся среди детей (в том числе внутри фрагментов) по
 * метаданным владельца, остальные узлы уходят в контент. Фрагмент клонируется
 * только если из него действительно извлекли слот.
 */
export const resolveFromChildren = (
  children: ReactNode,
  context: ResolveContext,
  values: SlotValues,
): ReactNode[] => {
  const contentItems: ReactNode[] = [];
  let extracted = 0;

  const visit = (nodes: ReactNode, content: ReactNode[]) => {
    eachChild(nodes, node => {
      if (!React.isValidElement(node)) {
        content.push(node);

        return;
      }

      if (node.type === React.Fragment) {
        const before = extracted;
        const inner: ReactNode[] = [];

        visit(
          (node as ReactElement<{ children?: ReactNode }>).props.children,
          inner,
        );

        if (inner.length > 0) {
          content.push(
            extracted === before
              ? node
              : React.cloneElement(
                  node,
                  undefined,
                  inner.length === 1 ? inner[0] : inner,
                ),
          );
        }

        return;
      }

      const meta = (node.type as Tagged)[SLOT_META];

      if (!meta) {
        content.push(node);

        return;
      }

      const entry = matchSlotEntry(meta, context);

      if (!entry) {
        if (isDev()) {
          assertOwnSlot(context, meta, entry);
        }

        content.push(node);

        return;
      }

      const value: SlotValue = { key: node.key, props: node.props as AnyProps };
      const current = values[entry.key];

      extracted++;

      if (!entry.multiple) {
        if (isDev()) {
          assertSingleValue(context, entry, current);
        }

        values[entry.key] = value;
      } else if (current) {
        (current as SlotValue[]).push(value);
      } else {
        values[entry.key] = [value];
      }
    });
  };

  visit(children, contentItems);

  return contentItems;
};
