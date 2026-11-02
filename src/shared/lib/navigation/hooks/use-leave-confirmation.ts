import { useNavigation } from "@react-navigation/native";
import { useLatestRef } from "@shared/lib/hooks";
import { useEffect } from "react";
import { Alert } from "react-native";

export interface LeaveConfirmDialog {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export interface UseLeaveConfirmationOptions {
  /** Есть что терять; функция читается в момент ухода (MobX-флаги). */
  when: boolean | (() => boolean);
  dialog?: LeaveConfirmDialog;
  /** Действие после согласия уйти; `false` — остаться. */
  onConfirm?: () => boolean | void | Promise<boolean | void>;
  disabled?: boolean;
}

const DEFAULT_DIALOG: Required<LeaveConfirmDialog> = {
  title: "Уйти с экрана?",
  description: "Несохранённые изменения пропадут.",
  confirmLabel: "Уйти",
  cancelLabel: "Остаться",
};

const resolveWhen = (when: UseLeaveConfirmationOptions["when"]) =>
  typeof when === "function" ? when() : when;

/**
 * Подтверждение ухода с экрана с несохранёнными изменениями: «назад»,
 * жест и аппаратная кнопка (событие `beforeRemove` навигатора).
 */
export const useLeaveConfirmation = (
  options: UseLeaveConfirmationOptions,
): void => {
  const navigation = useNavigation();
  const optionsRef = useLatestRef(options);

  useEffect(
    () =>
      navigation.addListener("beforeRemove", event => {
        const { when, disabled, dialog, onConfirm } = optionsRef.current;

        if (disabled || !resolveWhen(when)) return;

        event.preventDefault();

        const texts = { ...DEFAULT_DIALOG, ...dialog };

        Alert.alert(texts.title, texts.description, [
          { text: texts.cancelLabel, style: "cancel" },
          {
            text: texts.confirmLabel,
            style: "destructive",
            onPress: async () => {
              if ((await onConfirm?.()) === false) return;
              navigation.dispatch(event.data.action);
            },
          },
        ]);
      }),
    [navigation, optionsRef],
  );
};
