import { IApiService } from "@api";
import {
  BotDetailDto,
  BotDto,
  IBotSendMessageBody,
  ICreateBotBody,
  ISetCommandsBody,
  IUpdateBotBody,
  IWebhookTestResponse,
  WebhookLogDto,
} from "@api/api-gen/data-contracts";
import { CollectionHolder, EntityHolder, MutationHolder } from "@store/holders";
import { BotModel } from "@store/models";
import { makeAutoObservable } from "mobx";

import { IBotStore } from "./BotStore.types";

@IBotStore({ inSingleton: true })
export class BotStore implements IBotStore {
  public botsHolder = new CollectionHolder<BotDto>({
    keyExtractor: b => b.id,
  });
  public detailHolder = new EntityHolder<BotDetailDto, string>({
    onFetch: id => this._api.getBotById({ id }),
  });
  public createMutation = new MutationHolder<ICreateBotBody, BotDetailDto>({
    onMutate: async args => {
      const res = await this._api.createBot(args);

      if (res.data) {
        this.botsHolder.appendItem(res.data);
      }

      return res;
    },
  });
  public updateMutation = new MutationHolder<IUpdateBotBody, BotDetailDto>();
  public deleteMutation = new MutationHolder<string, void>({
    onMutate: async botId => {
      const res = await this._api.deleteBot({ id: botId });

      if (!res.error) {
        this.botsHolder.removeItem(botId);
      }

      return res;
    },
  });

  public webhookLogs: WebhookLogDto[] = [];
  public webhookLogsTotal = 0;
  public isLoadingLogs = false;
  public isTesting = false;
  public lastTestResult: IWebhookTestResponse | null = null;

  constructor(@IApiService() private _api: IApiService) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get bots() {
    return this.botsHolder.items;
  }

  get detail() {
    return this.detailHolder.data;
  }

  get detailModel() {
    return this.detailHolder.data ? new BotModel(this.detailHolder.data) : null;
  }

  get isLoading() {
    return this.botsHolder.isLoading;
  }

  async loadBots() {
    await this.botsHolder.fromApi(() => this._api.getMyBots());
  }

  async loadBot(id: string) {
    await this.detailHolder.load(id);
  }

  async createBot(data: ICreateBotBody) {
    await this.createMutation.execute(data);
  }

  async updateBot(id: string, data: IUpdateBotBody) {
    await this.updateMutation.execute(data, async args => {
      const res = await this._api.updateBot({ id }, args);

      if (res.data) {
        this.detailHolder.setData(res.data);
      }

      return res;
    });
  }

  async deleteBot(id: string) {
    await this.deleteMutation.execute(id);
  }

  async regenerateToken(id: string) {
    const res = await this._api.regenerateToken({ id });

    if (res.data) {
      this.detailHolder.setData(res.data);
    }
  }

  async setWebhook(id: string, url: string, secret?: string) {
    const res = await this._api.setWebhook({ id }, { url, secret });

    if (res.data) {
      this.detailHolder.setData(res.data);
    }
  }

  async deleteWebhook(id: string) {
    await this._api.deleteWebhook({ id });
    await this.loadBot(id);
  }

  async testWebhook(id: string): Promise<IWebhookTestResponse | null> {
    this.isTesting = true;
    this.lastTestResult = null;

    try {
      const res = await this._api.testWebhook({ id });

      this.lastTestResult = res.data ?? null;

      return this.lastTestResult;
    } finally {
      this.isTesting = false;
    }
  }

  async loadWebhookLogs(id: string, offset = 0, limit = 30): Promise<void> {
    this.isLoadingLogs = true;

    try {
      const res = await this._api.getWebhookLogs({ id, offset, limit });

      if (res.data) {
        this.webhookLogs = res.data.data;
        this.webhookLogsTotal = res.data.totalCount;
      }
    } finally {
      this.isLoadingLogs = false;
    }
  }

  async setWebhookEvents(id: string, events: string[]) {
    const res = await this._api.setWebhookEvents({ id }, { events });

    if (res.data) {
      this.detailHolder.setData(res.data);
    }
  }

  async setCommands(id: string, commands: ISetCommandsBody["commands"]) {
    return this._api.setCommands({ id }, { commands });
  }

  async getCommands(id: string) {
    return this._api.getCommands({ id });
  }

  async botSendMessage(data: IBotSendMessageBody) {
    return this._api.botSendMessage(data);
  }
}
