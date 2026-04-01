import { BotDetailDto } from "@api/api-gen/data-contracts";

import { TypedModel } from "../DataModelBase";

export class BotModel extends TypedModel<BotDetailDto>() {
  get name() {
    return this.displayName;
  }

  get hasWebhook() {
    return !!this.webhookUrl;
  }
}
