import type { IApiResponse, IHolderError } from "../holder.types";
import type { IMutationHolderResult, MutationHolder } from "./mutation-holder";

/**
 * Разовая мутация через общий холдер стора с типизированным результатом.
 * `MutationHolder.run` не знает тип конкретного ответа — стор держит один
 * холдер на все свои операции, и `data` там `unknown`.
 */
export const runMutation = async <
  TData,
  TError extends IHolderError = IHolderError,
>(
  holder: MutationHolder<void, unknown, TError>,
  fn: () => Promise<IApiResponse<TData>>,
): Promise<IMutationHolderResult<TData, TError>> => {
  const res = await holder.run(fn as () => Promise<IApiResponse<unknown>>);

  return { data: (res.data as TData | null) ?? null, error: res.error };
};
