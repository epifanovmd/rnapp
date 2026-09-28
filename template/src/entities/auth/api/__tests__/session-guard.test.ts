import { TokenSession } from "@shared/lib/session";

import type { IAuthStore } from "../../model/types";
import { AuthSessionGuard } from "../session-guard";

const createGuard = () => {
  const session = new TokenSession({ refresh: jest.fn() });
  const auth = { signOut: jest.fn() } as unknown as IAuthStore;

  return { guard: new AuthSessionGuard(auth, session), session };
};

describe("AuthSessionGuard", () => {
  it("узнаёт свою сессию по sessionId из ответа бэкенда, токен непрозрачный", () => {
    const { guard, session } = createGuard();

    session.setTokens({
      accessToken: "opaque-access",
      refreshToken: "r",
      sessionId: "s-1",
    });

    expect(guard.isCurrentSession("s-1")).toBe(true);
    expect(guard.isCurrentSession("s-2")).toBe(false);
  });

  it("без сессии чужие события не считает своими", () => {
    const { guard } = createGuard();

    expect(guard.isCurrentSession("s-1")).toBe(false);
  });
});
