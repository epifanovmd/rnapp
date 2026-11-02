import {
  FieldPath,
  FieldValues,
  useFormContext,
  useFormState,
} from "react-hook-form";

const readPath = (value: unknown, path: string): unknown =>
  path.split(".").reduce<unknown>((current, segment) => {
    if (typeof current !== "object" || current === null) {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, value);

/** Подписывается на состояние асинхронной проверки одного поля. */
export const useIsFieldValidating = <
  TFormData extends FieldValues,
  TName extends FieldPath<TFormData>,
>(
  name: TName,
): boolean => {
  const { control } = useFormContext<TFormData>();
  const { validatingFields } = useFormState({ control, name, exact: true });

  return readPath(validatingFields, name) === true;
};
