import { DataModelBase } from "@force-dev/utils";
import { IPost } from "@service";

export class PostModel extends DataModelBase<IPost | undefined> {
  get value() {
    return this.data;
  }
}
