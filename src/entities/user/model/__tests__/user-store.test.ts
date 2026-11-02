import type { IMainApi } from "@shared/api";
import type { PrivacySettingsDto } from "@shared/api/gen/main/model";

import { UserStore } from "../store";

describe("UserStore.reset", () => {
  it("сбрасывает и настройки приватности: следующий пользователь не видит чужих", async () => {
    const privacy = { showEmail: true } as unknown as PrivacySettingsDto;
    const store = new UserStore({
      getPrivacySettings: jest.fn(async () => ({ data: privacy })),
    } as unknown as IMainApi);

    await store.loadPrivacy();
    expect(store.privacy).toBe(privacy);

    store.reset();

    expect(store.privacy).toBeNull();
  });
});

describe("UserStore privacy", () => {
  it("updatePrivacy отдаёт ошибку API: потребитель решает, показывать ли её", async () => {
    const error = { message: "boom", status: 500, isServerError: true };
    const store = new UserStore({
      updatePrivacySettings: jest.fn(async () => ({ error })),
    } as unknown as IMainApi);

    const res = await store.updatePrivacy({});

    expect(res.error).toBe(error);
    expect(store.privacy).toBeNull();
  });

  it("updatePrivacy кладёт сохранённые настройки в стор", async () => {
    const privacy = { showAvatar: "everyone" } as unknown as PrivacySettingsDto;
    const store = new UserStore({
      updatePrivacySettings: jest.fn(async () => ({ data: privacy })),
    } as unknown as IMainApi);

    const res = await store.updatePrivacy({});

    expect(res.data).toBe(privacy);
    expect(store.privacy).toBe(privacy);
  });

  it("ошибка загрузки настроек приватности доступна через стор", async () => {
    const store = new UserStore({
      getPrivacySettings: jest.fn(async () => ({
        error: { message: "Сервер недоступен", status: 503 },
      })),
    } as unknown as IMainApi);

    await store.loadPrivacy();

    expect(store.privacy).toBeNull();
    expect(store.privacyError?.message).toBe("Сервер недоступен");
  });
});
