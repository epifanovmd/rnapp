import { createInjectDecorator } from "@shared/lib/di";
import {
  ApiResponse,
  CancelablePromise,
  IHttpClient,
  RequestOptions,
} from "@shared/lib/http";
import type { ITokenSession } from "@shared/lib/session";

/** Публичный демо-бэкенд https://dummyjson.com: товары и JWT-авторизация. */

export interface DummyJsonProductDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface DummyJsonProductReview {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
  reviewerEmail: string;
}

export interface DummyJsonProductMeta {
  createdAt: string;
  updatedAt: string;
  barcode: string;
  qrCode: string;
}

export interface DummyJsonProduct {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  /** Есть не у всех товаров. */
  brand?: string;
  sku: string;
  weight: number;
  dimensions: DummyJsonProductDimensions;
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  returnPolicy: string;
  minimumOrderQuantity: number;
  reviews: DummyJsonProductReview[];
  meta: DummyJsonProductMeta;
  images: string[];
  thumbnail: string;
}

export interface DummyJsonList<TItem> {
  total: number;
  skip: number;
  limit: number;
}

export interface DummyJsonProductList extends DummyJsonList<DummyJsonProduct> {
  products: DummyJsonProduct[];
}

export interface DummyJsonListParams {
  limit?: number;
  skip?: number;
  /** Поля через запятую; ответ придёт урезанным. */
  select?: string;
  sortBy?: string;
  order?: "asc" | "desc";
}

export interface DummyJsonUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  image: string;
}

export interface DummyJsonTokens {
  accessToken: string;
  refreshToken: string;
}

export type DummyJsonAuthUser = DummyJsonUser & DummyJsonTokens;

export interface DummyJsonCredentials {
  username: string;
  password: string;
  /** Время жизни access-токена; по умолчанию 60 минут. */
  expiresInMins?: number;
}

type Result<TData> = CancelablePromise<ApiResponse<TData>>;

/** DI-токен HTTP-клиента DummyJSON. */
export const IDummyJsonHttpClient = createInjectDecorator<IHttpClient>(
  "IDummyJsonHttpClient",
);

export const IDummyJsonApi =
  createInjectDecorator<IDummyJsonApi>("IDummyJsonApi");

export interface IDummyJsonApi {
  getProducts(
    params?: DummyJsonListParams,
    options?: RequestOptions,
  ): Result<DummyJsonProductList>;
  searchProducts(
    query: string,
    params?: DummyJsonListParams,
    options?: RequestOptions,
  ): Result<DummyJsonProductList>;
  getProduct(id: number, options?: RequestOptions): Result<DummyJsonProduct>;
  getCategories(options?: RequestOptions): Result<string[]>;
  /** Требует токена: иначе бэкенд ответит 401. */
  getMe(options?: RequestOptions): Result<DummyJsonUser>;
}

export const IDummyJsonSession =
  createInjectDecorator<IDummyJsonSession>("IDummyJsonSession");

/** Свои токены, не связанные с основным бэкендом; годится для `bearerAuth`. */
export interface IDummyJsonSession extends ITokenSession {
  login(credentials: DummyJsonCredentials): Result<DummyJsonAuthUser>;
}

export const IDummyJsonAuthApi =
  createInjectDecorator<IDummyJsonAuthApi>("IDummyJsonAuthApi");

export interface IDummyJsonAuthApi {
  login(credentials: DummyJsonCredentials): Result<DummyJsonAuthUser>;
  refresh(
    refreshToken: string,
    expiresInMins?: number,
  ): Result<DummyJsonTokens>;
}
