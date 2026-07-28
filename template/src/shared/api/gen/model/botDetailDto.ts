import type { BotCommandDto } from "./botCommandDto";

export interface BotDetailDto {
  id: string;
  username: string;
  displayName: string;
  /** @nullable */
  description: string | null;
  /** @nullable */
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  token: string;
  /** @nullable */
  webhookUrl: string | null;
  /** @nullable */
  webhookSecret: string | null;
  webhookEvents: string[];
  commands: BotCommandDto[];
}
