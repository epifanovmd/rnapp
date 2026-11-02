import { BaseApi, IHttpClient, RequestOptions } from "@shared/lib/http";

import type {
  DummyJsonListParams,
  DummyJsonProduct,
  DummyJsonProductList,
  DummyJsonUser,
  IDummyJsonApi,
} from "./dummyjson.types";

/** Рукописный API: эндпоинт добавляется одной строкой, без генерации. */
export class DummyJsonApi extends BaseApi implements IDummyJsonApi {
  constructor(http: IHttpClient) {
    super(http);
  }

  getProducts(params?: DummyJsonListParams, options?: RequestOptions) {
    return this.get<DummyJsonProductList>("/products", { ...options, params });
  }

  searchProducts(
    query: string,
    params?: DummyJsonListParams,
    options?: RequestOptions,
  ) {
    return this.get<DummyJsonProductList>("/products/search", {
      ...options,
      params: { ...params, q: query },
    });
  }

  getProduct(id: number, options?: RequestOptions) {
    return this.get<DummyJsonProduct>(`/products/${id}`, options);
  }

  getCategories(options?: RequestOptions) {
    return this.get<string[]>("/products/category-list", options);
  }

  getMe(options?: RequestOptions) {
    return this.get<DummyJsonUser>("/auth/me", options);
  }
}

export const createDummyJsonApi = (http: IHttpClient): IDummyJsonApi =>
  new DummyJsonApi(http);
