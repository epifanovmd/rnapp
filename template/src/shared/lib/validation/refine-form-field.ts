import { z } from "zod";

export interface RefineFormFieldOptions<
  TOutput,
  TField extends Extract<keyof TOutput, string>,
> {
  field: TField;
  message: string;
  check: (values: TOutput) => unknown | Promise<unknown>;
}

/** Добавляет sync/async-проверку с типизированным путём ошибки верхнего уровня. */
export const refineFormField = <
  TSchema extends z.ZodType,
  const TField extends Extract<keyof z.output<TSchema>, string>,
>(
  schema: TSchema,
  options: RefineFormFieldOptions<z.output<TSchema>, TField>,
): TSchema => {
  return schema.refine(options.check, {
    path: [options.field],
    message: options.message,
  });
};
