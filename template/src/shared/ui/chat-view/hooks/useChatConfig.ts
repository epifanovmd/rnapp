import { useMemo } from "react";

import { IInputBarLayout } from "../../input-bar";
import {
  createChatStyles,
  IChatFeatures,
  IChatLayout,
  IChatStyles,
  IChatViewTheme,
  resolveChatFeatures,
  resolveChatLayout,
  resolveChatTheme,
} from "../config";
import { ChatViewProps } from "../types";

/**
 * Разрешение пропов `theme` / `layout` / `features` в готовую конфигурацию.
 *
 * Отдельные пропы (`showSenderName`, `topThreshold`, …) перекрываются объектом
 * `features` — всё применяется разом. Геттеров здесь больше нет: пагинация,
 * прилипшая дата и видимость теперь считаются списком, а не стабильными
 * колбэками, которым требовалось читать «текущее» в обход зависимостей.
 */
export interface IChatConfig {
  theme: IChatViewTheme;
  layout: IChatLayout;
  inputBarLayout: IInputBarLayout;
  features: IChatFeatures;
  styles: IChatStyles;
}

export const useChatConfig = ({
  theme: themeName,
  layout: layoutProp,
  features: featuresProp,
}: ChatViewProps): IChatConfig => {
  const theme = useMemo(() => resolveChatTheme(themeName), [themeName]);

  const { chat: layout, inputBar: inputBarLayout } = useMemo(
    () => resolveChatLayout(layoutProp),
    [layoutProp],
  );

  const features = useMemo(
    () => resolveChatFeatures(featuresProp),
    [featuresProp],
  );

  // Стили пересобираются только при смене темы или метрик: ячейка не должна
  // аллоцировать три десятка объектов стиля на каждый рендер.
  const styles = useMemo(
    () => createChatStyles(theme, layout),
    [theme, layout],
  );

  return useMemo(
    () => ({ theme, layout, inputBarLayout, features, styles }),
    [theme, layout, inputBarLayout, features, styles],
  );
};
