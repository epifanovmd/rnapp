import { PollDto } from "@api/api-gen/data-contracts";

import { TypedModel } from "../DataModelBase";

export class PollModel extends TypedModel<PollDto>() {
  get totalVotes() {
    return this.options.reduce((sum, o) => sum + o.voterCount, 0);
  }
}
