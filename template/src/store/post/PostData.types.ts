import { DataHolder, iocDecorator } from "@force-dev/utils";

import { PostModel } from "../../models";
import { IPost } from "../../service";

export const IPostDataStore = iocDecorator<IPostDataStore>();

export interface IPostDataStore {
  holder: DataHolder<IPost>;

  data?: IPost;
  model?: PostModel;

  error?: string;
  loading: boolean;
  loaded: boolean;

  onRefresh(id: number): Promise<IPost | undefined>;
}
