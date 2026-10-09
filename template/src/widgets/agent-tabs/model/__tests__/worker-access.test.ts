import { workerRowAccess } from "../worker-access";

const options = {
  canManage: true,
  live: true,
  candidate: "1.2.0",
  pending: null,
};

describe("workerRowAccess", () => {
  it("с правом и на связи — перезапуск и обновление из выпуска", () => {
    expect(workerRowAccess({ release: true }, options)).toEqual({
      canRestart: true,
      updateTo: "1.2.0",
      canReplaceNow: false,
    });
  });

  it("не из выпуска — без обновления; занят или ждёт — заменить сейчас", () => {
    expect(
      workerRowAccess({ health: { ok: true, busy: true } }, options),
    ).toEqual({ canRestart: true, updateTo: null, canReplaceNow: true });
    expect(
      workerRowAccess({ release: true }, { ...options, pending: "update" })
        .canReplaceNow,
    ).toBe(true);
  });

  it("без права, без связи или встроенный — действий нет", () => {
    const none = { canRestart: false, updateTo: null, canReplaceNow: false };

    expect(
      workerRowAccess({ release: true }, { ...options, canManage: false }),
    ).toEqual(none);
    expect(
      workerRowAccess({ release: true }, { ...options, live: false }),
    ).toEqual(none);
    expect(workerRowAccess({ builtin: true, release: true }, options)).toEqual(
      none,
    );
  });
});
