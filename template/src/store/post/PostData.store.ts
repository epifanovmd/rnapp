import { AsyncDataSource } from "@force-dev/utils";
import { makeAutoObservable } from "mobx";

import { PostModel } from "~@models";
import { IPost, IPostsService } from "~@service";

import { IPostDataStore } from "./PostData.types";

@IPostDataStore()
export class PostDataStore implements IPostDataStore {
  public dataSource: AsyncDataSource<IPost, number>;
  public model = new PostModel(() => this.data);

  constructor(@IPostsService() private _postService: IPostsService) {
    this.dataSource = new AsyncDataSource(query =>
      this._postService.getPost(query),
    );
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get data() {
    return this.dataSource.d;
  }

  get error() {
    return this.dataSource.error?.msg;
  }

  get loading() {
    return this.dataSource.isLoading;
  }

  get loaded() {
    return this.dataSource.isReady;
  }

  onRefresh = async (id: number) => {
    return this.dataSource.refresh(id);
  };
}
