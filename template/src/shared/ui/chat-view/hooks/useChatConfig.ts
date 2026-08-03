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

export interface IChatConfig {
  theme: IChatViewTheme;
  layout: IChatLayout;
  inputBarLayout: IInputBarLayout;
  features: IChatFeatures;
  styles: IChatStyles;
}

/** Пропы `theme` / `layout` / `features` — в готовую конфигурацию и стили. */
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

  const styles = useMemo(
    () => createChatStyles(theme, layout),
    [theme, layout],
  );

  return useMemo(
    () => ({ theme, layout, inputBarLayout, features, styles }),
    [theme, layout, inputBarLayout, features, styles],
  );
};
