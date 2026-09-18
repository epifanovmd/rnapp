import type { PollOptionDto } from "./pollOptionDto";

export interface PollDto {
  id: string;
  messageId: string;
  question: string;
  isAnonymous: boolean;
  isMultipleChoice: boolean;
  isClosed: boolean;
  /** @nullable */
  closedAt: string | null;
  options: PollOptionDto[];
  totalVotes: number;
  userVotedOptionIds: string[];
  createdAt: string;
  updatedAt: string;
}
