import { createContext, useContext } from "react";

export interface IDialogContext {
  /** Запрос на закрытие диалога — вызывает onClose потребителя. */
  close: () => void;
}

export const DialogContext = createContext<IDialogContext | null>(null);

export const useDialogContext = () => useContext(DialogContext);
