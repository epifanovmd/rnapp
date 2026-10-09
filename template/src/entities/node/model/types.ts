import type {
  IAgentMetricsPointDto,
  NodeDto,
} from "@shared/api/gen/main/model";
import { createInjectDecorator } from "@shared/lib/di";
import type { IHolderError } from "@shared/lib/holders";

export const INodesStore = createInjectDecorator<INodesStore>("INodesStore");

/**
 * Узлы в области просмотра. Список — запросом, изменения — событиями
 * (`useNodesRealtime`, комната узла); экран узла берёт его отсюда же.
 */
export interface INodesStore {
  /** По названию. */
  readonly nodes: NodeDto[];
  readonly isLoading: boolean;
  /** Список хотя бы раз загружен. */
  readonly isLoaded: boolean;
  readonly error: IHolderError | null;

  load(): Promise<void>;
  /** Узел по id с сервера: экран виден, даже если списка ещё нет. */
  fetch(id: string): Promise<{ error: IHolderError | null }>;
  byId(id: string): NodeDto | undefined;
  /** `node:updated`: добавить или заменить. */
  upsert(node: NodeDto): void;
  /** `node:deleted`. */
  remove(id: string): void;
  /** `node:load`: последняя нагрузка узла. */
  applyLoad(load: INodeLoadEvent): void;
  /** Нагрузка узла из событий; не приходила — `undefined`. */
  loadOf(nodeId: string): INodeLoadEvent | undefined;
  reset(): void;
}

/** Событие `node:load`: точка метрик узла от его агента (без метрик воркеров). */
export interface INodeLoadEvent {
  nodeId: string;
  agentId: string;
  point: IAgentMetricsPointDto;
}
