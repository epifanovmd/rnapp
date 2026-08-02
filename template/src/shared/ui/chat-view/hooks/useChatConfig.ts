import { useCallback, useMemo, useRef } from "react";

import {
  IChatViewFeatures,
  IChatViewLayout,
  IChatViewTheme,
  resolveChatFeatures,
  resolveChatLayout,
  resolveChatTheme,
} from "../config";
import { ChatViewProps } from "../types";

/**
 * Разрешение конфигурации — порт полей `theme` / `layout` / `features`
 * из `ChatViewController` вместе с их `didSet`.
 *
 * Отдельные пропы (`showSenderName`, `topThreshold`, …) перекрываются
 * объектом `features` — ровно как в эталоне, где `batchUpdate` применяет
 * всё разом.
 *
 * Геттеры нужны стабильным колбэкам (скролл, пагинация, видимость): они
 * не должны пересоздаваться при смене темы, но обязаны читать актуальное.
 */

export interface IChatConfig {
  theme: IChatViewTheme;
  layout: IChatViewLayout;
  features: IChatViewFeatures;
  getTheme: () => IChatViewTheme;
  getLayout: () => IChatViewLayout;
  getFeatures: () => IChatViewFeatures;
}

export const useChatConfig = (props: ChatViewProps): IChatConfig => {
  const {
    theme: themeName = "light",
    layout: layoutProp,
    features: featuresProp,
    emojiReactions,
    showSenderName,
    showFloatingDate,
    topThreshold,
    bottomThreshold,
    scrollToBottomThreshold,
  } = props;

  const theme = useMemo(() => resolveChatTheme(themeName), [themeName]);
  const layout = useMemo(() => resolveChatLayout(layoutProp), [layoutProp]);
  const features = useMemo(
    () =>
      resolveChatFeatures({
        features: featuresProp,
        emojiReactions,
        showSenderName,
        showFloatingDate,
        topThreshold,
        bottomThreshold,
        scrollToBottomThreshold,
      }),
    [
      featuresProp,
      emojiReactions,
      showSenderName,
      showFloatingDate,
      topThreshold,
      bottomThreshold,
      scrollToBottomThreshold,
    ],
  );

  const ref = useRef({ theme, layout, features });

  ref.current = { theme, layout, features };

  const getTheme = useCallback(() => ref.current.theme, []);
  const getLayout = useCallback(() => ref.current.layout, []);
  const getFeatures = useCallback(() => ref.current.features, []);

  return useMemo(
    () => ({ theme, layout, features, getTheme, getLayout, getFeatures }),
    [theme, layout, features, getTheme, getLayout, getFeatures],
  );
};
