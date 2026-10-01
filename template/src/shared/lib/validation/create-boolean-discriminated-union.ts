import { z } from "zod";

type BooleanDiscriminatorShape<
  TDiscriminator extends string,
  TValue extends boolean,
> = {
  [TKey in TDiscriminator]: z.ZodLiteral<TValue>;
};

export interface BooleanDiscriminatedUnionOptions<
  TDiscriminator extends string,
  TEnabledShape extends z.ZodRawShape,
  TDisabledShape extends z.ZodRawShape,
> {
  discriminator: TDiscriminator;
  enabled: z.ZodObject<TEnabledShape>;
  disabled: z.ZodObject<TDisabledShape>;
}

/** Создаёт структурные true/false-ветки, сохраняя объектные схемы явными. */
export const createBooleanDiscriminatedUnion = <
  const TDiscriminator extends string,
  TEnabledShape extends z.ZodRawShape,
  TDisabledShape extends z.ZodRawShape,
>({
  discriminator,
  enabled,
  disabled,
}: BooleanDiscriminatedUnionOptions<
  TDiscriminator,
  TEnabledShape,
  TDisabledShape
>) => {
  const enabledDiscriminator = {
    [discriminator]: z.literal(true),
  } as BooleanDiscriminatorShape<TDiscriminator, true>;
  const disabledDiscriminator = {
    [discriminator]: z.literal(false),
  } as BooleanDiscriminatorShape<TDiscriminator, false>;

  return z.discriminatedUnion(discriminator, [
    enabled.extend(enabledDiscriminator),
    disabled.extend(disabledDiscriminator),
  ]);
};
