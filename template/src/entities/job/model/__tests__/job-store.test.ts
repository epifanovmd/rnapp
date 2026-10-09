import type { IMainApi } from "@shared/api";
import type { JobRunDto } from "@shared/api/gen/main/model";
import { EJobRunStatus } from "@shared/api/gen/main/model";

import { JobStore } from "../store";

const job = (id: string, status: EJobRunStatus = EJobRunStatus.queued) =>
  ({
    id,
    queue: "demo.echo",
    status,
    title: id,
    progress: 0,
    progressText: null,
    logTail: [],
    result: null,
    error: null,
    ownerId: "u1",
    scopeType: null,
    scopeId: null,
    attempt: 0,
    cancelRequested: false,
    agentId: null,
    worker: null,
    jobType: null,
    outputs: null,
    deadlineAt: null,
    startedAt: null,
    finishedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  }) as JobRunDto;

const cancelable = <T>(value: T) =>
  Object.assign(Promise.resolve(value), { cancel: jest.fn() });

const createStore = (api: Partial<IMainApi>) => new JobStore(api as IMainApi);

describe("JobStore", () => {
  it("загружает страницу задач по смещению", async () => {
    const listJobs = jest.fn(() =>
      cancelable({
        data: { items: [job("j1"), job("j2")], total: 2, offset: 0, limit: 20 },
      }),
    );
    const store = createStore({ listJobs: listJobs as never });

    await store.load();

    expect(listJobs).toHaveBeenCalledWith({ offset: 0, limit: 20 });
    expect(store.jobs.map(j => j.id)).toEqual(["j1", "j2"]);
    expect(store.jobsHolder.hasMore).toBe(false);
  });

  it("job:updated заменяет известную задачу", () => {
    const store = createStore({});

    store.jobsHolder.setItems([job("j1"), job("j2")], false);
    store.handleJobUpdated(job("j2", EJobRunStatus.running));

    expect(store.jobs.map(j => [j.id, j.status])).toEqual([
      ["j1", EJobRunStatus.queued],
      ["j2", EJobRunStatus.running],
    ]);
  });

  it("job:updated новой задачи добавляет её в начало", () => {
    const store = createStore({});

    store.jobsHolder.setItems([job("j1")], false);
    store.handleJobUpdated(job("j0"));

    expect(store.jobs.map(j => j.id)).toEqual(["j0", "j1"]);
  });

  it("демо-задача после запуска появляется в списке", async () => {
    const demoEchoJob = jest.fn(async () => ({ data: { jobId: "j9" } }));
    const store = createStore({
      demoEchoJob: demoEchoJob as never,
      getJob: jest.fn(async () => ({ data: job("j9") })) as never,
    });

    const res = await store.startDemoEcho({ text: "hi", long: true });

    expect(demoEchoJob).toHaveBeenCalledWith({ text: "hi", long: true });
    expect(res.data?.id).toBe("j9");
    expect(store.jobs.map(j => j.id)).toEqual(["j9"]);
  });
});
