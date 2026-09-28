import type { ApiError, ApiResponse } from "@shared/lib/http";

/** Страница по смещению в ответах основного бэкенда. */
export interface IOffsetPage<TItem> {
  items: TItem[];
  total: number;
  offset: number;
  limit: number;
}

/** Страница в форме, которую ждут холдеры бесконечных списков. */
export interface IHolderPage<TItem> {
  data: TItem[];
  totalCount: number;
}

/** Переводит ответ со страницей `{ items, total }` в `{ data, totalCount }` холдеров. */
export const toHolderPage = <TItem>(
  res: ApiResponse<IOffsetPage<TItem>>,
): ApiResponse<IHolderPage<TItem>, ApiError> =>
  res.error
    ? { error: res.error }
    : { data: { data: res.data.items, totalCount: res.data.total } };
