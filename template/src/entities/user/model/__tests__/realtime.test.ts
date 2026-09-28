import { UserRealtime } from "../realtime";

const setup = () => {
  let handlers: Record<string, (data: unknown) => void> = {};
  const socket = {
    subscribe: (h: typeof handlers) => {
      handlers = h;

      return () => {};
    },
  };
  const userStore = {
    user: { id: "u1" },
    refresh: jest.fn().mockResolvedValue({ data: null, error: null }),
    patchProfile: jest.fn(),
  };

  new UserRealtime(
    socket as never,
    userStore as never,
    {} as never,
  ).initialize();

  return { handlers, userStore };
};

describe("UserRealtime", () => {
  it("свой profile:updated (публичный профиль, без avatar) — перечитать пользователя, аватар с другого устройства", () => {
    const { handlers, userStore } = setup();

    handlers.onProfileUpdated({ userId: "u1", avatarUrl: "https://x/a.webp" });

    expect(userStore.refresh).toHaveBeenCalledTimes(1);
    expect(userStore.patchProfile).not.toHaveBeenCalled();
  });

  it("чужой profile:updated игнорируется", () => {
    const { handlers, userStore } = setup();

    handlers.onProfileUpdated({ userId: "u2", avatarUrl: null });

    expect(userStore.refresh).not.toHaveBeenCalled();
  });
});
