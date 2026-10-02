import {
  IScrollContent,
  IScrollReveal,
  useScrollRevealAnchor,
} from "@shared/lib/scroll-reveal";
import React, { FC, PropsWithChildren } from "react";
import { StyleProp, View, ViewStyle } from "react-native";

import type { TRevealPreset } from "./reveal-style";
import { RevealView } from "./RevealView";

export interface IScrollRevealAnchorProps {
  reveal: IScrollReveal;
  /** Гаснуть, уходя (пока содержимое появляется в шапке). По умолчанию `true`. */
  fadeOut?: boolean;
  /** Как уходить при `fadeOut`. По умолчанию `"fade"`. */
  preset?: TRevealPreset;
  /** Скролл якоря; по умолчанию — скролл экрана из контекста. */
  content?: IScrollContent | null;
  style?: StyleProp<ViewStyle>;
}

/**
 * Якорь перехода в прокручиваемом контенте (`ScreenScroll`): его уход за верх
 * ведёт `reveal.progress`; сам по умолчанию гаснет.
 */
export const ScrollRevealAnchor: FC<
  PropsWithChildren<IScrollRevealAnchorProps>
> = ({ reveal, fadeOut = true, preset = "fade", content, style, children }) => {
  const anchor = useScrollRevealAnchor(reveal, content);

  return (
    <View ref={anchor.ref} onLayout={anchor.onLayout} style={style}>
      {fadeOut ? (
        <RevealView progress={reveal.progress} preset={preset} inverse>
          {children}
        </RevealView>
      ) : (
        children
      )}
    </View>
  );
};
