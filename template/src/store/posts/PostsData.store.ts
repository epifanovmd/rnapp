import { ListCollectionHolder } from "@force-dev/utils";
import { RefreshArgs } from "@force-dev/utils/src/store/holders/ListCollectionHolder";
import { PostModel } from "@models";
import {
  IPost,
  IPostSearchRequest,
  IPostsRequest,
  IPostsService,
} from "@service";
import { makeAutoObservable } from "mobx";

import { IPostsDataStore } from "./PostsData.types";

@IPostsDataStore()
export class PostsDataStore implements IPostsDataStore {
  public holder: ListCollectionHolder<IPost, IPostsRequest> =
    new ListCollectionHolder();

  constructor(@IPostsService() private _postsService: IPostsService) {
    makeAutoObservable(this, {}, { autoBind: true });
    this.holder.initialize({
      pageSize: 10,
      onFetchData: this._onRefresh,
      keyExtractor: item => item.id,
    });
  }

  get data() {
    return this.holder.d;
  }

  get models() {
    return this.data.map(post => new PostModel(post));
  }

  get error() {
    return this.holder.error?.msg;
  }

  get loading() {
    return this.holder.isLoading;
  }

  get loaded() {
    return this.holder.isReady;
  }

  async onSearch(args: IPostSearchRequest) {
    this.holder.setLoading();
    const res = await this._postsService.search(args);

    if (res.error) {
      this.holder.setError({ msg: res.error.toString() });
    } else if (res.data) {
      this.holder.updateData(res.data.posts);

      return res.data.posts;
    }

    return [];
  }

  async onRefresh(args?: IPostsRequest) {
    return this.holder.performRefresh(args);
  }

  async onLoadMore(args?: IPostsRequest) {
    return this.holder.performLoadMore(args);
  }

  private async _onRefresh({ offset, ...params }: RefreshArgs & IPostsRequest) {
    const res = await this._postsService.getAll({
      ...params,
      skip: offset,
      limit: params.limit ?? params.limit,
    });

    if (res.error) {
      this.holder.setError({ msg: res.error.toString() });
    } else if (res.data) {
      this.holder.updateData(res.data.posts);

      return res.data.posts;
    }

    return [];
  }
}
