import { useCallback } from "react";
import { Alert } from "react-native";

export type TConfirmVariant = "default" | "destructive";

export interface ModalConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `destructive` — красная кнопка подтверждения (iOS). */
  confirmVariant?: TConfirmVariant;
  /** Действие после согласия; его ошибка уходит в `onConfirmError`. */
  onConfirm?: () => void | Promise<void>;
  onConfirmError?: (error: unknown) => void;
}

export type TConfirm = (options: ModalConfirmOptions) => Promise<boolean>;

/** Системный диалог подтверждения; промис — `true`, если пользователь согласился. */
export const confirmAlert: TConfirm = ({
  title,
  description,
  confirmLabel = "Подтвердить",
  cancelLabel = "Отмена",
  confirmVariant = "default",
  onConfirm,
  onConfirmError,
}) =>
  new Promise<boolean>(resolve => {
    Alert.alert(
      title,
      description,
      [
        { text: cancelLabel, style: "cancel", onPress: () => resolve(false) },
        {
          text: confirmLabel,
          style: confirmVariant === "destructive" ? "destructive" : "default",
          onPress: async () => {
            try {
              await onConfirm?.();
              resolve(true);
            } catch (error) {
              onConfirmError?.(error);
              resolve(false);
            }
          },
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });

/** Подтверждение действия: `if (!(await confirm({ title }))) return;`. */
export const useConfirm = (): TConfirm => useCallback(confirmAlert, []);
