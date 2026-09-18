import { ApiError, HttpError, NetworkError } from "../core/errors";
import { withHeaders } from "../middleware/headers.middleware";
import {
  transformError,
  transformRequest,
  transformResponse,
} from "../middleware/transform.middleware";
import { createClient, createFakeTransport, ok } from "./test-utils";

class DomainError extends ApiError {
  readonly kind = "unknown" as const;

  constructor(readonly original: ApiError) {
    super(`domain: ${original.message}`, { cause: original });
  }
}

describe("transform middlewares", () => {
  it("transformRequest: возврат нового объекта и мутация", async () => {
    const transport = createFakeTransport(() => ok(null));
    const client = createClient(transport, {
      middlewares: [
        transformRequest(req => ({ ...req, url: `/v2${req.url}` })),
        transformRequest(req => {
          req.params = { ...req.params, lang: "ru" };
        }),
      ],
    });

    await client.request({ url: "/a", params: { x: 1 } });

    expect(transport.calls[0]).toMatchObject({
      url: "/v2/a",
      params: { x: 1, lang: "ru" },
    });
  });

  it("transformResponse: распаковка envelope, в т.ч. асинхронная", async () => {
    const transport = createFakeTransport(() => ok({ payload: [1, 2] }));
    const client = createClient(transport, {
      middlewares: [
        transformResponse<{ payload: number[] }, number[]>(async res => ({
          ...res,
          data: res.data.payload,
        })),
      ],
    });

    expect((await client.request({ url: "/a" })).data).toEqual([1, 2]);
  });

  it("transformError: маппинг в доменную ошибку, чужие исключения приходят уже ApiError", async () => {
    const seen: ApiError[] = [];
    const mw = transformError(error => {
      seen.push(error);

      return new DomainError(error);
    });
    const res = await createClient(
      createFakeTransport(() => {
        throw new HttpError({ status: 422, body: { message: "bad" } });
      }),
      { middlewares: [mw] },
    ).request({ url: "/a" });
    const raw = await createClient(
      createFakeTransport(() => {
        throw new Error("raw");
      }),
      { middlewares: [mw] },
    ).request({ url: "/b" });

    expect(res.error).toBeInstanceOf(DomainError);
    expect(res.error?.message).toBe("domain: bad");
    expect(raw.error?.message).toBe("domain: raw");
    expect(seen[1].request).toEqual({
      method: "GET",
      url: "https://api.test/b",
    });
  });

  it("withHeaders: статичные и вычисляемые", async () => {
    const transport = createFakeTransport(() => ok(null));
    const client = createClient(transport, {
      middlewares: [
        withHeaders({ "X-Api-Key": "k" }),
        withHeaders(ctx => ({ "X-Method": ctx.request.method ?? "" })),
      ],
    });

    await client.request({ url: "/a", method: "put" });

    expect(transport.calls[0].headers).toMatchObject({
      "X-Api-Key": "k",
      "X-Method": "PUT",
    });
  });

  it("порядок: transformError не видит NetworkError, если ниже её уже перехватили", async () => {
    const client = createClient(
      createFakeTransport(() => {
        throw new NetworkError();
      }),
      {
        middlewares: [
          transformError(e => new DomainError(e)),
          transformError(() => new HttpError({ status: 599 })),
        ],
      },
    );
    const res = await client.request({ url: "/a" });

    expect(res.error).toBeInstanceOf(DomainError);
    expect((res.error as DomainError).original.status).toBe(599);
  });
});
