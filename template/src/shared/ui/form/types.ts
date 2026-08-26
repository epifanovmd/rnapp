import type {
  Control,
  ControllerFieldState,
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  UseControllerProps,
  UseFormStateReturn,
} from "react-hook-form";

export interface FormFieldBaseProps<
  TFormData extends FieldValues,
  TName extends FieldPath<TFormData>,
> {
  name: TName;
  control?: Control<TFormData>;
}

export type FormControllerOptions<
  TFormData extends FieldValues,
  TName extends FieldPath<TFormData>,
> = Pick<
  UseControllerProps<TFormData, TName>,
  "control" | "defaultValue" | "disabled" | "rules" | "shouldUnregister"
>;

export type FormAdapterProps<
  TFormData extends FieldValues,
  TName extends FieldPath<TFormData>,
> = FormFieldBaseProps<TFormData, TName> &
  FormControllerOptions<TFormData, TName>;

export interface FormFieldRenderProps<
  TFormData extends FieldValues,
  TName extends FieldPath<TFormData>,
> {
  field: ControllerRenderProps<TFormData, TName>;
  fieldState: ControllerFieldState;
  formState: UseFormStateReturn<TFormData>;
}
