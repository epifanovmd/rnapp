import { DataHolder } from "@force-dev/utils";
import { makeAutoObservable } from "mobx";

import { PostModel } from "../../models";
import { IPost, IPostsService } from "../../service";
import { IPostDataStore } from "./PostData.types";

@IPostDataStore()
export class PostDataStore implements IPostDataStore {
  public holder: DataHolder<IPost> = new DataHolder<IPost>();

  constructor(@IPostsService() private _postService: IPostsService) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get data() {
    return this.holder.d;
  }

  get model() {
    return this.data && new PostModel(this.data);
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

  async onRefresh(id: number) {
    this.holder.setLoading();
    const res = await this._postService.getPost(id);

    if (res.error) {
      this.holder.setError({ msg: res.error.toString() });
    } else if (res.data) {
      this.holder.setData(res.data);

      return res.data;
    }

    return undefined;
  }
}
