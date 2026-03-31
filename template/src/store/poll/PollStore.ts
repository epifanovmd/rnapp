import { IApiService } from "@api";
import { ICreatePollBody, PollDto } from "@api/api-gen/data-contracts";
import { EntityHolder } from "@store/holders";
import { makeAutoObservable } from "mobx";

import { IPollStore } from "./PollStore.types";

@IPollStore({ inSingleton: true })
export class PollStore implements IPollStore {
  public pollHolder = new EntityHolder<PollDto>();

  constructor(@IApiService() private _api: IApiService) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  async createPoll(chatId: string, data: ICreatePollBody) {
    return this._api.createPoll({ chatId }, data);
  }

  async getPoll(pollId: string) {
    await this.pollHolder.fromApi(() => this._api.getPoll({ id: pollId }));
  }

  async vote(pollId: string, optionIds: string[]) {
    return this._api.vote({ id: pollId }, { optionIds });
  }

  async retractVote(pollId: string) {
    return this._api.retractVote({ id: pollId });
  }

  async closePoll(pollId: string) {
    return this._api.closePoll({ id: pollId });
  }

  handlePollVoted(poll: PollDto) {
    if (this.pollHolder.data?.id === poll.id) {
      this.pollHolder.setData(poll);
    }
  }

  handlePollClosed(poll: PollDto) {
    if (this.pollHolder.data?.id === poll.id) {
      this.pollHolder.setData(poll);
    }
  }
}
