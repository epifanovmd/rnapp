import type { ReactElement, ReactNode } from "react";
import React from "react";

import type {
  AnyProps,
  SlotEntry,
  SlotResolution,
  SlotValue,
  SlotValues,
  Tagged,
} from "./slot-runtime";
import { eachChild, matchSlotEntry, SLOT_META } from "./slot-runtime";

/**
 * JSX-стратегия: слоты ищутся среди детей (в том числе внутри фрагментов) по
 * метаданным владельца, остальные узлы уходят в контент. Фрагмент клонируется
 * только если из него действительно извлекли слот.
 */
export const resolveFromChildren = (
  children: ReactNode,
  owner: symbol,
  ownerName: string,
  entries: readonly SlotEntry[],
): SlotResolution => {
  const values: SlotValues = {};
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

      const entry = matchSlotEntry(meta, owner, ownerName, entries);

      if (!entry) {
        throw new Error(
          `${ownerName} received ${meta.ownerName}.${meta.entry.name}. ` +
            `The slot belongs to ${meta.ownerName}.`,
        );
      }

      const value: SlotValue = { key: node.key, props: node.props as AnyProps };
      const current = values[entry.key];

      extracted++;

      if (!entry.multiple) {
        if (current) {
          throw new Error(
            `${ownerName} received duplicate slot "${entry.key}". ` +
              `Declare it with multiple: true if repetition is expected.`,
          );
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

  return { contentItems, values };
};
