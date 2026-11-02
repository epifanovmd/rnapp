import { HttpError } from "@shared/lib/http";
import {
  createFakeTransport,
  createTestClient,
  ok,
} from "@shared/lib/http/testing/fake-transport";

import { DummyJsonApi } from "../dummyjson.api";
import type {
  DummyJsonProduct,
  DummyJsonProductList,
} from "../dummyjson.types";

const product = (id: number): DummyJsonProduct =>
  ({ id, title: `p-${id}`, price: 1 }) as DummyJsonProduct;

const list = (ids: number[]): DummyJsonProductList => ({
  products: ids.map(product),
  total: ids.length,
  skip: 0,
  limit: ids.length,
});

const createApi = (data: unknown = null) => {
  const transport = createFakeTransport(() => ok(data));

  return { api: new DummyJsonApi(createTestClient(transport)), transport };
};

describe("DummyJsonApi", () => {
  it("getProducts передаёт пагинацию в query", async () => {
    const { api, transport } = createApi(list([1, 2]));
    const res = await api.getProducts({ limit: 2, skip: 10, sortBy: "price" });

    expect(res.data?.products).toHaveLength(2);
    expect(transport.calls[0]).toMatchObject({
      method: "GET",
      url: "/products",
      params: { limit: 2, skip: 10, sortBy: "price" },
    });
  });

  it("searchProducts добавляет q к остальным параметрам", async () => {
    const { api, transport } = createApi(list([1]));

    await api.searchProducts("phone", { limit: 5 });

    expect(transport.calls[0]).toMatchObject({
      url: "/products/search",
      params: { q: "phone", limit: 5 },
    });
  });

  it("getProduct, getCategories и getMe бьют в свои URL", async () => {
    const { api, transport } = createApi(product(7));

    await api.getProduct(7);
    await api.getCategories();
    await api.getMe();

    expect(transport.calls.map(c => c.url)).toEqual([
      "/products/7",
      "/products/category-list",
      "/auth/me",
    ]);
  });

  it("per-call options доходят до запроса", async () => {
    const { api, transport } = createApi(product(1));

    await api.getProduct(1, { headers: { "X-Trace": "1" }, timeout: 500 });
    await api.getProducts({ limit: 1 }, { baseUrl: "https://mirror.test" });

    expect(transport.calls[0]).toMatchObject({
      headers: { "X-Trace": "1" },
      timeout: 500,
    });
    expect(transport.calls[1]).toMatchObject({
      baseUrl: "https://mirror.test",
      params: { limit: 1 },
    });
  });

  it("404 от бэкенда приходит как HttpError с сообщением из тела", async () => {
    const transport = createFakeTransport(() => {
      throw new HttpError({
        status: 404,
        body: { message: "Product with id '9999' not found" },
      });
    });
    const api = new DummyJsonApi(createTestClient(transport));
    const res = await api.getProduct(9999);

    expect(res.error?.status).toBe(404);
    expect(res.error?.isNotFound).toBe(true);
    expect(res.error?.message).toBe("Product with id '9999' not found");
  });

  it("запрос отменяем", async () => {
    const { api } = createApi(list([1]));
    const pending = api.getProducts();

    expect(typeof pending.cancel).toBe("function");
    await pending;
  });
});
