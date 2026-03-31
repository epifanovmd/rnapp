import {
  BotCommandDto,
  BotDetailDto,
  BotDto,
  ICreateBotBody,
  ISetCommandsBody,
  IUpdateBotBody,
  IWebhookLogsResponse,
  IWebhookTestResponse,
} from "@api/api-gen/data-contracts";
import { ApiResponse } from "@api/api-gen/http-client";
import { createServiceDecorator } from "@di";
import { CollectionHolder, EntityHolder, MutationHolder } from "@store/holders";

export const IBotStore = createServiceDecorator<IBotStore>();

export interface IBotStore {
  botsHolder: CollectionHolder<BotDto>;
  detailHolder: EntityHolder<BotDetailDto, string>;
  createMutation: MutationHolder<ICreateBotBody, BotDetailDto>;
  deleteMutation: MutationHolder<string>;

  bots: BotDto[];
  detail: BotDetailDto | null;
  isLoading: boolean;

  loadBots(): Promise<void>;
  loadBot(id: string): Promise<void>;
  createBot(data: ICreateBotBody): Promise<void>;
  updateBot(id: string, data: IUpdateBotBody): Promise<void>;
  deleteBot(id: string): Promise<void>;
  regenerateToken(id: string): Promise<void>;
  setWebhook(id: string, url: string, secret?: string): Promise<void>;
  deleteWebhook(id: string): Promise<void>;
  testWebhook(id: string): Promise<IWebhookTestResponse | null>;
  getWebhookLogs(
    id: string,
    offset?: number,
    limit?: number,
  ): Promise<IWebhookLogsResponse | null>;
  setWebhookEvents(id: string, events: string[]): Promise<void>;
  setCommands(
    id: string,
    commands: ISetCommandsBody["commands"],
  ): Promise<ApiResponse<BotCommandDto[]>>;
  getCommands(id: string): Promise<ApiResponse<BotCommandDto[]>>;
}
