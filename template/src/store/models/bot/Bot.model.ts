import { BotDetailDto } from "@api/api-gen/data-contracts";

import { DataModelBase } from "../DataModelBase";

export class BotModel extends DataModelBase<BotDetailDto> {
  get id() {
    return this.data.id;
  }

  get name() {
    return this.data.displayName;
  }

  get username() {
    return this.data.username;
  }

  get description() {
    return this.data.description;
  }

  get isActive() {
    return this.data.isActive;
  }

  get webhookUrl() {
    return this.data.webhookUrl;
  }

  get hasWebhook() {
    return !!this.data.webhookUrl;
  }
}
