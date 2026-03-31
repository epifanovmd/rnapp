import { PollDto } from "@api/api-gen/data-contracts";

import { DataModelBase } from "../DataModelBase";

export class PollModel extends DataModelBase<PollDto> {
  get id() {
    return this.data.id;
  }

  get question() {
    return this.data.question;
  }

  get options() {
    return this.data.options;
  }

  get isClosed() {
    return this.data.isClosed;
  }

  get isAnonymous() {
    return this.data.isAnonymous;
  }

  get isMultipleChoice() {
    return this.data.isMultipleChoice;
  }

  get totalVotes() {
    return this.data.options.reduce((sum, o) => sum + o.voterCount, 0);
  }
}
