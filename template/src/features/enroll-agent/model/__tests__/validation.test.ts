import {
  enrollmentTokenSchema,
  enrollmentTokenState,
  INSTALL_DEFAULTS,
  installCommandBody,
  installCommandSchema,
  parsePairs,
  splitList,
  tokenExpiresAt,
} from "../validation";

// Барель сущности тянет UI и нативные модули — подменяем чистыми модулями.
jest.mock("@entities/agent", () => ({
  ...jest.requireActual("@entities/agent/model/validation"),
}));

const NOW = Date.parse("2026-10-01T00:00:00.000Z");

describe("enroll validation", () => {
  it("срок токена от текущего момента; бессрочный — без срока", () => {
    expect(tokenExpiresAt("1h", NOW)).toBe("2026-10-01T01:00:00.000Z");
    expect(tokenExpiresAt("never", NOW)).toBeUndefined();
  });

  it("состояние токена: отзыв, срок, исчерпан", () => {
    const token = {
      revokedAt: null,
      expiresAt: "2026-10-02T00:00:00.000Z",
      maxUses: 1,
      uses: 0,
    };

    expect(enrollmentTokenState(token, NOW)).toBe("active");
    expect(enrollmentTokenState({ ...token, uses: 1 }, NOW)).toBe("used");
    expect(
      enrollmentTokenState(
        { ...token, expiresAt: "2026-09-30T00:00:00.000Z" },
        NOW,
      ),
    ).toBe("expired");
    expect(enrollmentTokenState({ ...token, revokedAt: "x" }, NOW)).toBe(
      "revoked",
    );
  });

  it("пары ключ=значение; ключ с пробелом — ошибка", () => {
    expect(parsePairs("zone=eu, gpu\nrack = 3")).toEqual({
      pairs: { zone: "eu", gpu: "", rack: "3" },
    });
    expect(parsePairs("bad key=1")).toEqual({ error: "bad key=1" });
    expect(splitList("curl, jq\n tar")).toEqual(["curl", "jq", "tar"]);
  });

  it("метки токена: пусто — без меток", () => {
    expect(
      enrollmentTokenSchema.parse({
        name: "eu",
        expiry: "1d",
        singleUse: true,
        labels: "",
      }).labels,
    ).toBeUndefined();
  });

  it("команда: токен или файл — что-то одно; пустое не отправляется", () => {
    expect(installCommandSchema.safeParse(INSTALL_DEFAULTS).success).toBe(
      false,
    );

    const values = installCommandSchema.parse({
      ...INSTALL_DEFAULTS,
      token: "prefix.secret",
      packages: "curl jq",
      sysctl: "net.ipv4.ip_forward=1",
    });

    expect(installCommandBody(values)).toEqual({
      token: "prefix.secret",
      tokenFile: undefined,
      name: undefined,
      baseUrl: undefined,
      user: undefined,
      workers: undefined,
      privileged: undefined,
      stopTimeout: undefined,
      config: undefined,
      killMode: undefined,
      packages: ["curl", "jq"],
      rwPaths: undefined,
      sysctl: { "net.ipv4.ip_forward": "1" },
      caFile: undefined,
      releases: undefined,
    });
  });
});
