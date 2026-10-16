import { NotificationStore } from "../notification.store";

jest.mock("react-native-haptic-feedback", () => ({
  __esModule: true,
  default: { trigger: jest.fn() },
  HapticFeedbackTypes: {},
}));

const createStore = () => {
  const store = new NotificationStore();

  store.configure({ haptic: false, announceForAccessibility: false });

  return store;
};

describe("NotificationStore.promise", () => {
  it("заменяет уведомление загрузки на успех с тем же id", async () => {
    const store = createStore();

    await expect(
      store.promise(Promise.resolve(2), {
        loading: "Сохраняем",
        success: value => `Готово: ${value}`,
        error: "Ошибка",
      }),
    ).resolves.toBe(2);

    expect(store.visible).toHaveLength(1);
    expect(store.visible[0]).toMatchObject({
      variant: "success",
      message: "Готово: 2",
    });
  });

  it("сбой в messages.success: значение возвращается, уведомление загрузки снимается", async () => {
    const store = createStore();

    await expect(
      store.promise(Promise.resolve(1), {
        loading: "Сохраняем",
        success: () => {
          throw new Error("format failed");
        },
        error: "Ошибка",
      }),
    ).resolves.toBe(1);

    expect(store.visible.every(item => item.closing)).toBe(true);
  });

  it("сбой в messages.error: наружу исходная ошибка, уведомление загрузки снимается", async () => {
    const store = createStore();

    await expect(
      store.promise(Promise.reject(new Error("request failed")), {
        loading: "Сохраняем",
        success: "Готово",
        error: () => {
          throw new Error("format failed");
        },
      }),
    ).rejects.toThrow("request failed");

    expect(store.visible.every(item => item.closing)).toBe(true);
  });
});
