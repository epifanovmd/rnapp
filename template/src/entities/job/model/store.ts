import { IMainApi, toHolderPage } from "@shared/api";
import type { IDemoEchoData, JobRunDto } from "@shared/api/gen/main/model";
import { InfiniteHolder } from "@shared/lib/holders";
import { ApiError, ApiResponse, mapCancelable } from "@shared/lib/http";
import { injectable } from "inversify";
import { makeAutoObservable } from "mobx";

import { IJobStore } from "./types";

const PAGE_SIZE = 20;

@injectable()
export class JobStore implements IJobStore {
  public jobsHolder = new InfiniteHolder<JobRunDto>({
    keyExtractor: job => job.id,
    pageSize: PAGE_SIZE,
    onFetch: ({ offset, limit }) =>
      mapCancelable(this._api.listJobs({ offset, limit }), toHolderPage),
  });

  constructor(@IMainApi() private _api: IMainApi) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get jobs() {
    return this.jobsHolder.items;
  }

  async load() {
    await this.jobsHolder.load();
  }

  async refresh() {
    await this.jobsHolder.refresh();
  }

  async loadMore() {
    await this.jobsHolder.loadMore();
  }

  cancel(id: string) {
    return this._api.cancelJob(id);
  }

  async startDemoEcho(
    data: IDemoEchoData,
  ): Promise<ApiResponse<JobRunDto, ApiError>> {
    const started = await this._api.demoEchoJob(data);

    if (started.error) return { error: started.error };

    const res = await this._api.getJob(started.data.jobId);

    if (res.data) {
      this.handleJobUpdated(res.data);
    }

    return res;
  }

  handleJobUpdated(job: JobRunDto) {
    if (this.jobsHolder.exists(job.id)) {
      this.jobsHolder.updateItem(job.id, job);
    } else {
      this.jobsHolder.prependItem(job);
    }
  }

  reset() {
    this.jobsHolder.reset();
  }
}
