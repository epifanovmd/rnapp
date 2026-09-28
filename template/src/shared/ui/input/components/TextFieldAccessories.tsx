import { useTheme } from "@shared/lib/theme";
import React, { FC, memo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { Icon, TIconName } from "../../icon";

export interface ITextFieldAccessoriesProps {
  /** Прижать к верху (multiline-поле). */
  alignTop?: boolean;
  /** Переключатель видимости пароля. */
  showSecureToggle: boolean;
  secure?: boolean;
  onToggleSecure: () => void;
  showClear: boolean;
  onClear: () => void;
  showError: boolean;
  disabled?: boolean;
  /** Произвольный контент справа (до системных иконок). */
  right?: React.ReactNode;
}

/** Правые аксессуары поля: кастомный контент, secure-глаз, очистка, ошибка. */
export const TextFieldAccessories: FC<ITextFieldAccessoriesProps> = memo(
  ({
    showSecureToggle,
    secure,
    onToggleSecure,
    showClear,
    onClear,
    showError,
    disabled,
    right,
    alignTop,
  }) => {
    const { colors } = useTheme();
    const secureIcon: TIconName = secure ? "eyeOff" : "eye";

    if (!right && !showSecureToggle && !showClear && !showError) {
      return null;
    }

    return (
      <View style={[styles.container, alignTop && styles.top]}>
        {right}
        {showSecureToggle && (
          <TouchableOpacity
            accessibilityRole={"button"}
            accessibilityLabel={secure ? "Показать пароль" : "Скрыть пароль"}
            disabled={disabled}
            activeOpacity={1}
            style={styles.icon}
            onPress={onToggleSecure}
          >
            <Icon color={colors.textTertiary} name={secureIcon} />
          </TouchableOpacity>
        )}
        {showClear && (
          <TouchableOpacity
            accessibilityRole={"button"}
            accessibilityLabel={"Очистить"}
            disabled={disabled}
            activeOpacity={1}
            style={styles.icon}
            onPress={onClear}
          >
            <Icon color={colors.textTertiary} name={"close"} />
          </TouchableOpacity>
        )}
        {showError && (
          <View style={styles.icon}>
            <Icon color={colors.danger} name={"closeCircle"} />
          </View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    marginLeft: 8,
  },
  top: {
    alignSelf: "flex-start",
    paddingVertical: 8,
  },
  icon: {
    justifyContent: "center",
    alignItems: "center",
  },
});
