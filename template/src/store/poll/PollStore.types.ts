import { ApiError } from "@api";
import { ICreatePollBody, PollDto } from "@api/api-gen/data-contracts";
import { ApiResponse } from "@api/api-gen/http-client";
import { createServiceDecorator } from "@di";
import { EntityHolder } from "@store/holders";

export const IPollStore = createServiceDecorator<IPollStore>();

export interface IPollStore {
  readonly pollHolder: EntityHolder<PollDto>;

  createPoll(
    chatId: string,
    data: ICreatePollBody,
  ): Promise<ApiResponse<PollDto, ApiError>>;
  getPoll(pollId: string): Promise<void>;
  vote(
    pollId: string,
    optionIds: string[],
  ): Promise<ApiResponse<PollDto, ApiError>>;
  retractVote(pollId: string): Promise<ApiResponse<PollDto, ApiError>>;
  closePoll(pollId: string): Promise<ApiResponse<PollDto, ApiError>>;

  handlePollVoted(poll: PollDto): void;
  handlePollClosed(poll: PollDto): void;
}
