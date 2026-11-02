import {
  createFakeTransport,
  createTestClient,
  ok,
} from "@shared/lib/http/testing/fake-transport";

import { MainAuthApi } from "../main-auth.api";

describe("MainAuthApi", () => {
  it("обновляет токены по версионированному пути API", async () => {
    const transport = createFakeTransport(() =>
      ok({ accessToken: "a2", refreshToken: "r2" }),
    );
    const api = new MainAuthApi(createTestClient(transport));

    const res = await api.refresh("r1");

    expect(res.data).toEqual({ accessToken: "a2", refreshToken: "r2" });
    expect(transport.calls[0].url).toBe("/api/v1/auth/refresh");
    expect(transport.calls[0].data).toEqual({ refreshToken: "r1" });
  });
});
