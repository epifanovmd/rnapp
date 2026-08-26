import { createContext, useContext } from "react";

export interface FormSubmitContextValue {
  submit: () => Promise<unknown>;
}

export const FormSubmitContext = createContext<FormSubmitContextValue | null>(
  null,
);

/** Возвращает submit ближайшей формы и защищает от использования вне Form. */
export const useFormSubmit = (): FormSubmitContextValue => {
  const context = useContext(FormSubmitContext);

  if (!context) {
    throw new Error("FormSubmit должен находиться внутри Form");
  }

  return context;
};
