import { ViewStyle } from "react-native";

/**
 * Стиль контента keyboard-aware скролла делится на два уровня: всё (отступы,
 * gap, выравнивание) — обёртке детей, чтобы после распорки в конце контента
 * не было отступов; контейнеру ScrollView — только `flexGrow`, чтобы
 * обёртка по-прежнему могла растянуться на высоту экрана.
 */
export const splitContentContainerStyle = (style: ViewStyle | undefined) => ({
  container:
    style?.flexGrow !== undefined ? { flexGrow: style.flexGrow } : undefined,
  content: style,
});
