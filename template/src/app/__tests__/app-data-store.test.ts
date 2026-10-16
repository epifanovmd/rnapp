import { disposer } from "@shared/lib/utils";
import { observable, runInAction } from "mobx";

import { AppDataStore } from "../app-data-store";

// Декораторы DI из барелей — без нативных модулей RN.
jest.mock("@entities/agent", () => ({
  IAgentsStore: () => () => undefined,
}));
jest.mock("@entities/audit", () => ({
  IAuditRealtime: () => () => undefined,
  IAuditStore: () => () => undefined,
}));
jest.mock("@entities/auth", () => ({ IAuthStore: () => () => undefined }));
jest.mock("@entities/file", () => ({
  IFileRealtime: () => () => undefined,
  IFileStore: () => () => undefined,
}));
jest.mock("@entities/job", () => ({
  IJobRealtime: () => () => undefined,
  IJobStore: () => () => undefined,
}));
jest.mock("@entities/node", () => ({
  INodesStore: () => () => undefined,
}));
jest.mock("@entities/user", () => ({
  ISessionStore: () => () => undefined,
  IUserRealtime: () => () => undefined,
  IUserStore: () => () => undefined,
}));
jest.mock("@shared/lib/socket", () => ({
  ISocketTransport: () => () => undefined,
}));

const create = (isAuthenticated = false) => {
  const auth = observable({ isAuthenticated });
  const realtime = { initialize: jest.fn(() => jest.fn()) };
  const userStore = { load: jest.fn(), reset: jest.fn() };
  const sessionStore = { reset: jest.fn() };
  const stores = { reset: jest.fn() };
  const store = new AppDataStore(
    auth as any,
    realtime as any,
    userStore as any,
    realtime as any,
    stores as any,
    realtime as any,
    stores as any,
    realtime as any,
    stores as any,
    realtime as any,
    stores as any,
    stores as any,
    sessionStore as any,
  );

  return { auth, realtime, userStore, sessionStore, stores, store };
};

const setup = () => {
  const created = create();

  created.store.initialize();
  runInAction(() => (created.auth.isAuthenticated = true));

  return created;
};

describe("AppDataStore", () => {
  it("вход подписывает realtime, включая свой журнал", () => {
    const { realtime } = setup();

    expect(realtime.initialize).toHaveBeenCalledTimes(5);
  });

  it("выход сбрасывает пользователя: следующий вход не видит прежних данных", () => {
    const { auth, userStore, stores } = setup();

    runInAction(() => (auth.isAuthenticated = false));

    expect(userStore.reset).toHaveBeenCalledTimes(1);
    // Файлы, задачи, журнал, агенты и узлы.
    expect(stores.reset).toHaveBeenCalledTimes(5);
  });

  it("выход сбрасывает список сессий прежнего пользователя", () => {
    const { auth, sessionStore } = setup();

    runInAction(() => (auth.isAuthenticated = false));

    expect(sessionStore.reset).toHaveBeenCalledTimes(1);
  });
});

describe("AppDataStore — повторная инициализация", () => {
  it("уже авторизован при initialize — сокет и realtime стартуют сразу", () => {
    const { realtime, userStore, store } = create(true);

    store.initialize();

    expect(realtime.initialize).toHaveBeenCalledTimes(5);
    expect(userStore.load).toHaveBeenCalledTimes(1);
  });

  it("dispose и повторный initialize (Fast Refresh) — сессия стартует заново", () => {
    const { realtime, store } = create(true);
    const stop = jest.fn();

    realtime.initialize.mockReturnValueOnce(stop);
    disposer(store.initialize());

    expect(stop).toHaveBeenCalledTimes(1);

    store.initialize();

    expect(realtime.initialize).toHaveBeenCalledTimes(10);
  });

  it("не авторизован при initialize — данные не сбрасывает", () => {
    const { userStore, store } = create(false);

    store.initialize();

    expect(userStore.reset).not.toHaveBeenCalled();
  });
});
