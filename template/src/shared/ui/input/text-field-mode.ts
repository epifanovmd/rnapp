export interface ITextFieldModeInput {
  /** Задан `onPress`: поле — триггер (пикер, шторка), а не ввод. */
  triggerable?: boolean;
  editable?: boolean;
  clearable?: boolean;
  hasValue: boolean;
  hasError: boolean;
}

export interface ITextFieldMode {
  isTrigger: boolean;
  /** Настоящий disabled (`editable={false}`): приглушение и без нажатий. */
  disabled: boolean;
  /** Ввод с клавиатуры. */
  inputEditable: boolean;
  showClear: boolean;
}

/**
 * Режим TextField: поле ввода или поле-триггер. У триггера ввод выключен, но
 * поле не disabled; крестик очистки у него остаётся и при ошибке.
 */
export const resolveTextFieldMode = ({
  triggerable,
  editable,
  clearable,
  hasValue,
  hasError,
}: ITextFieldModeInput): ITextFieldMode => {
  const isTrigger = !!triggerable;
  const disabled = editable === false;

  return {
    isTrigger,
    disabled,
    inputEditable: !isTrigger && !disabled,
    showClear:
      !!clearable && hasValue && !disabled && (isTrigger || !hasError),
  };
};
