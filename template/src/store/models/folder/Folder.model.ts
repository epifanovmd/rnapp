import { ChatFolderDto } from "@api/api-gen/data-contracts";

import { DataModelBase } from "../DataModelBase";

export class FolderModel extends DataModelBase<ChatFolderDto> {
  get id() {
    return this.data.id;
  }

  get name() {
    return this.data.name;
  }

  get position() {
    return this.data.position;
  }
}
