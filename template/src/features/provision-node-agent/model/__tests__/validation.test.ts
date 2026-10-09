import {
  installCommandSchema,
  sshBody,
  sshDefaults,
  sshSchema,
  workersBody,
} from "../validation";

describe("provision validation", () => {
  it("по умолчанию — адрес узла, root, пароль и все воркеры с сервера", () => {
    expect(sshDefaults("203.0.113.10", ["echo", "netprobe"])).toMatchObject({
      host: "203.0.113.10",
      port: 22,
      username: "root",
      auth: "password",
      workers: ["echo", "netprobe"],
    });
  });

  it("пароль или ключ обязателен по способу входа", () => {
    const base = sshDefaults("203.0.113.10", []);

    expect(sshSchema.safeParse(base).success).toBe(false);
    expect(sshSchema.safeParse({ ...base, password: "secret" }).success).toBe(
      true,
    );
    expect(
      sshSchema.safeParse({ ...base, auth: "key", password: "secret" }).success,
    ).toBe(false);
  });

  it("тело SSH: пустое не отправляется, root — без sudo", () => {
    const values = sshSchema.parse({
      ...sshDefaults("", []),
      auth: "key",
      privateKey: "-----BEGIN KEY-----",
      password: "unused",
    });

    expect(sshBody(values)).toEqual({
      host: undefined,
      port: 22,
      username: "root",
      privateKey: "-----BEGIN KEY-----",
      passphrase: undefined,
      sudo: undefined,
      backendUrl: undefined,
    });
    expect(
      sshBody({
        ...values,
        username: "deploy",
        auth: "password",
        password: "p",
      }),
    ).toMatchObject({ username: "deploy", password: "p", sudo: true });
  });

  it("воркеры: ничего не выбрано — решает сервер", () => {
    expect(workersBody([])).toBeUndefined();
    expect(workersBody(["echo"])).toEqual(["echo"]);
  });

  it("срок токена — от 5 минут до 30 дней", () => {
    const parse = (expiresInMinutes: number) =>
      installCommandSchema.safeParse({
        expiresInMinutes,
        baseUrl: "",
        workers: [],
      }).success;

    expect(parse(4)).toBe(false);
    expect(parse(1440)).toBe(true);
    expect(parse(43_201)).toBe(false);
  });
});
