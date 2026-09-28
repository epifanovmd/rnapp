import { observable, runInAction } from "mobx";

import { AppDataStore } from "../app-data-store";

// Декораторы DI из барелей — без нативных модулей RN.
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
jest.mock("@entities/user", () => ({
  IUserRealtime: () => () => undefined,
  IUserStore: () => () => undefined,
}));
jest.mock("@shared/lib/socket", () => ({
  ISocketTransport: () => () => undefined,
}));

const setup = () => {
  const auth = observable({ isAuthenticated: false });
  const realtime = { initialize: jest.fn(() => jest.fn()) };
  const userStore = { load: jest.fn(), reset: jest.fn() };
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
  );

  store.initialize();
  runInAction(() => (auth.isAuthenticated = true));

  return { auth, realtime, userStore };
};

describe("AppDataStore", () => {
  it("вход подписывает realtime, включая свой журнал", () => {
    const { realtime } = setup();

    expect(realtime.initialize).toHaveBeenCalledTimes(5);
  });

  it("выход сбрасывает пользователя: следующий вход не видит прежних данных", () => {
    const { auth, userStore } = setup();

    runInAction(() => (auth.isAuthenticated = false));

    expect(userStore.reset).toHaveBeenCalledTimes(1);
  });
});
