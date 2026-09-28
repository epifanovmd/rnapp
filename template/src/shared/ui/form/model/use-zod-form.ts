import { zodResolver } from "@hookform/resolvers/zod";
import {
  FieldValues,
  useForm,
  UseFormProps,
  UseFormReturn,
} from "react-hook-form";
import { z } from "zod";

/** Создаёт RHF-форму, сохраняя разные input/output-типы Zod-схемы. */
export const useZodForm = <
  TInput extends FieldValues,
  TOutput extends FieldValues,
>(
  schema: z.ZodType<TOutput, TInput>,
  options: Omit<UseFormProps<TInput, unknown, TOutput>, "resolver"> = {},
): UseFormReturn<TInput, unknown, TOutput> =>
  useForm<TInput, unknown, TOutput>({
    mode: "onBlur",
    reValidateMode: "onChange",
    shouldFocusError: true,
    ...options,
    resolver: zodResolver(schema),
  });
