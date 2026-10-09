import { IMainApi } from "@shared/api";
import type { NodeDto } from "@shared/api/gen/main/model";
import { CollectionHolder } from "@shared/lib/holders";
import { injectable } from "inversify";
import { makeAutoObservable, observable } from "mobx";

import { INodeLoadEvent, INodesStore } from "./types";

/** Узлов немного — одним списком. */
const NODES_LIMIT = 100;

const byName = (a: NodeDto, b: NodeDto): number => a.name.localeCompare(b.name);

@injectable()
export class NodesStore implements INodesStore {
  private _list = new CollectionHolder<NodeDto>({
    onFetch: async () => {
      const { data, error } = await this._api.getNodes({ limit: NODES_LIMIT });

      return { data: data?.items ?? null, error };
    },
    keyExtractor: node => node.id,
  });

  private _loads = observable.map<string, INodeLoadEvent>();

  constructor(@IMainApi() private _api: IMainApi) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get nodes() {
    return [...this._list.items].sort(byName);
  }

  get isLoading() {
    return this._list.isLoading;
  }

  get isLoaded() {
    return this._list.isSuccess || this._list.isRefreshing;
  }

  get error() {
    return this._list.error;
  }

  async load() {
    if (this._list.isSuccess) await this._list.refresh();
    else await this._list.load();
  }

  async fetch(id: string) {
    const { data, error } = await this._api.getNodeById(id);

    if (data) this.upsert(data);

    return { error: error ?? null };
  }

  byId(id: string) {
    return this._list.get(id);
  }

  upsert(node: NodeDto) {
    this._list.upsertItem(node.id, node);
  }

  remove(id: string) {
    this._list.removeItem(id);
    this._loads.delete(id);
  }

  applyLoad(load: INodeLoadEvent) {
    const known = this._loads.get(load.nodeId);

    if (!known || known.point.at <= load.point.at) {
      this._loads.set(load.nodeId, load);
    }
  }

  loadOf(nodeId: string) {
    return this._loads.get(nodeId);
  }

  reset() {
    this._list.reset();
    this._loads.clear();
  }
}
