import { isJwtExpired, jwtExpiresIn, parseJwt } from "../jwt";
import { makeJwt as token, nowSeconds as now } from "./token-test-utils";

describe("jwt", () => {
  it("парсит payload, включая произвольные поля и не-ASCII", () => {
    const payload = parseJwt(
      token({ sub: "1", iat: 0, exp: 100, sessionId: "s-1", name: "Эмили" }),
    );

    expect(payload).toMatchObject({ sub: "1", exp: 100, sessionId: "s-1" });
    expect(payload?.name).toBe("Эмили");
  });

  it("возвращает null на битом токене", () => {
    expect(parseJwt("")).toBeNull();
    expect(parseJwt("no-dots")).toBeNull();
    expect(parseJwt("a.!!!.c")).toBeNull();
    expect(parseJwt(token({ sub: "1", iat: 0 }))).toBeNull();
    expect(parseJwt(token({ exp: 1, iat: 0 }))).toBeNull();
  });

  it("isJwtExpired учитывает буфер, битый токен считает истёкшим", () => {
    expect(isJwtExpired(token({ sub: "1", iat: 0, exp: now() + 600 }))).toBe(
      false,
    );
    expect(isJwtExpired(token({ sub: "1", iat: 0, exp: now() + 10 }))).toBe(
      true,
    );
    expect(isJwtExpired(token({ sub: "1", iat: 0, exp: now() + 10 }), 0)).toBe(
      false,
    );
    expect(isJwtExpired("")).toBe(true);
  });

  it("jwtExpiresIn не уходит в минус", () => {
    expect(
      jwtExpiresIn(token({ sub: "1", iat: 0, exp: now() + 600 }), 0),
    ).toBeGreaterThan(590);
    expect(jwtExpiresIn(token({ sub: "1", iat: 0, exp: now() - 10 }))).toBe(0);
    expect(jwtExpiresIn("broken")).toBe(0);
  });
});
