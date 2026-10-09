import type { NodeDto } from "@shared/api/gen/main/model";

import { nodeOwners } from "./permissions";

/** Фильтр списка узлов. */
export interface INodeFilter {
  /** Поиск по названию, адресу и описанию. */
  query: string;
  /** Только свои: владелец или создатель. */
  mine: boolean;
}

/** Узлы под фильтром; `userId` — текущий пользователь для «Мои». */
export const filterNodes = (
  nodes: NodeDto[],
  filter: INodeFilter,
  userId: string | null,
): NodeDto[] => {
  const query = filter.query.trim().toLowerCase();

  return nodes.filter(node => {
    if (filter.mine && (!userId || !nodeOwners(node).includes(userId))) {
      return false;
    }
    if (!query) return true;

    return [node.name, node.host, node.description].some(value =>
      value?.toLowerCase().includes(query),
    );
  });
};
