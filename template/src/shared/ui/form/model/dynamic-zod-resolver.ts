import { zodResolver } from "@hookform/resolvers/zod";
import { FieldValues, Resolver } from "react-hook-form";
import { z } from "zod";

type ShapeKey<TShape extends z.ZodRawShape> = Extract<keyof TShape, string>;

export type DynamicZodOmitMask<TShape extends z.ZodRawShape> = Partial<
  Record<ShapeKey<TShape>, boolean>
>;

type ConditionalKey<
  TShape extends z.ZodRawShape,
  TMask extends object,
> = Extract<keyof TMask, keyof z.output<z.ZodObject<TShape>>>;

export type DynamicZodOutput<
  TShape extends z.ZodRawShape,
  TMask extends object,
> = Omit<z.output<z.ZodObject<TShape>>, ConditionalKey<TShape, TMask>> &
  Partial<Pick<z.output<z.ZodObject<TShape>>, ConditionalKey<TShape, TMask>>>;

export type DynamicZodRefine<
  TShape extends z.ZodRawShape,
  TMask extends object,
> = (
  values: DynamicZodOutput<TShape, TMask>,
  context: z.RefinementCtx,
) => void | Promise<void>;

/**
 * Исключает неактивные поля из схемы по текущим значениям формы. Исключённые
 * поля не валидируются и отсутствуют в submit-результате.
 *
 * Ключи, возвращаемые `omit`, становятся optional в `DynamicZodOutput`:
 * runtime-схема может удалить их, даже если исходная схема считает их
 * обязательными. Поэтому output нужно передать третьим generic-параметром RHF.
 * `refine` может быть синхронным или асинхронным.
 *
 * @example
 * const getOmitted = (values: z.input<typeof schema>) => ({
 *   companyName: values.kind !== "company",
 * });
 * type Values = z.input<typeof schema>;
 * type Result = DynamicZodOutput<
 *   typeof schema.shape,
 *   ReturnType<typeof getOmitted>
 * >;
 * const form = useForm<Values, unknown, Result>({
 *   resolver: dynamicZodResolver(schema, getOmitted),
 * });
 */
export const dynamicZodResolver = <
  TShape extends z.ZodRawShape,
  const TMask extends Record<string, boolean>,
>(
  schema: z.ZodObject<TShape>,
  omit: (
    values: z.input<z.ZodObject<TShape>>,
  ) => TMask & Record<Exclude<keyof TMask, ShapeKey<TShape>>, never>,
  refine?: DynamicZodRefine<TShape, TMask>,
): Resolver<
  z.input<typeof schema> & FieldValues,
  unknown,
  DynamicZodOutput<TShape, TMask> & FieldValues
> => {
  type DynamicResolver = Resolver<
    z.input<typeof schema> & FieldValues,
    unknown,
    DynamicZodOutput<TShape, TMask> & FieldValues
  >;

  const cache = new Map<string, DynamicResolver>();

  return async (values, context, options) => {
    const flags = omit(values);
    const omittedKeys = Object.entries(flags)
      .filter(
        ([key, shouldOmit]) =>
          shouldOmit === true && Object.hasOwn(schema.shape, key),
      )
      .map(([key]) => key)
      .sort();
    const cacheKey = omittedKeys.join("\0");
    let resolver = cache.get(cacheKey);

    if (!resolver) {
      const mask = Object.fromEntries(omittedKeys.map(key => [key, true]));
      const selectedSchema = schema.omit(mask as never);
      const validatedSchema = refine
        ? selectedSchema.superRefine(async (data, refinementContext) => {
            await refine(
              data as DynamicZodOutput<TShape, TMask>,
              refinementContext,
            );
          })
        : selectedSchema;

      resolver = zodResolver(validatedSchema) as DynamicResolver;
      cache.set(cacheKey, resolver);
    }

    return resolver(values, context, options);
  };
};
