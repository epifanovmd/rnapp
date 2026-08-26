import React, { useMemo } from "react";
import {
  FieldValues,
  FormProvider,
  SubmitErrorHandler,
  SubmitHandler,
  UseFormReturn,
} from "react-hook-form";
import { View, ViewProps } from "react-native";

import { FormSubmitContext } from "./form-context";

export interface FormProps<
  TFormData extends FieldValues,
  TContext = unknown,
  TOutput extends FieldValues = TFormData,
> extends ViewProps {
  form: UseFormReturn<TFormData, TContext, TOutput>;
  onSubmit: SubmitHandler<TOutput>;
  onInvalid?: SubmitErrorHandler<TFormData>;
}

/**
 * Контейнер React Hook Form для React Native. Submit запускается через
 * FormSubmit либо вручную через `form.handleSubmit`.
 */
export const Form = <
  TFormData extends FieldValues,
  TContext = unknown,
  TOutput extends FieldValues = TFormData,
>({
  form,
  onSubmit,
  onInvalid,
  children,
  ...viewProps
}: FormProps<TFormData, TContext, TOutput>) => {
  const submit = useMemo(
    () => form.handleSubmit(onSubmit, onInvalid),
    [form, onInvalid, onSubmit],
  );
  const submitContext = useMemo(() => ({ submit }), [submit]);

  return (
    <FormProvider {...form}>
      <FormSubmitContext.Provider value={submitContext}>
        <View {...viewProps}>{children}</View>
      </FormSubmitContext.Provider>
    </FormProvider>
  );
};
