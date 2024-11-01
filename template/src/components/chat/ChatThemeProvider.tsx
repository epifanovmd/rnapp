import { isEqual } from "lodash";
import React, {
  createContext,
  FC,
  memo,
  PropsWithChildren,
  useContext,
} from "react";

export interface ChatTheme {
  background: string;
  toolbarBackground: string;
  toolbarActionIconFill: string;
  toolbarSendIconFill: string;
  toolbarInputBackground: string;
  toolbarInputColor: string;
  toolbarPlaceholderTextColor: string;
  typingColor: string;
  leftBubbleBackground: string;
  leftTickColor: string;
  leftTimeColor: string;
  leftBubbleInfoColor: string;
  leftBubbleColor: string;
  leftUsernameColor: string;
  leftTextColor: string;
  rightBubbleBackground: string;
  rightTickColor: string;
  rightTimeColor: string;
  rightBubbleInfoColor: string;
  rightBubbleColor: string;
  rightUsernameColor: string;
  rightTextColor: string;
  systemMessageColor: string;
  systemMessageBackground: string;
  dateColor: string;
  dateBackground: string;
  scrollToBottomIconFill: string;
  scrollToBottomBackground: string;
  scrollToBottomShadowColor: string;
  loadEarlierBackground: string;
  loadEarlierColor: string;
  replyIconColor: string;
  [key: string]: string;
}

export const defaultChatTheme: ChatTheme = {
  background: "transparent",

  // toolbar
  toolbarBackground: "#616161",
  toolbarActionIconFill: "#fff",
  toolbarSendIconFill: "#fff",
  toolbarInputBackground: "#000",
  toolbarInputColor: "#fff",
  toolbarPlaceholderTextColor: "#fff",
  toolbarReplyBackground: "#616161",

  typingColor: "#000",

  // bubble
  leftBubbleBackground: "#f0f0f0",
  leftTickColor: "#aaa",
  leftTimeColor: "#aaa",
  leftBubbleInfoColor: "#fff",
  leftBubbleColor: "#fff",
  leftUsernameColor: "#aaa",
  leftTextColor: "#000",

  rightBubbleBackground: "#0084ff",
  rightTickColor: "#fff",
  rightTimeColor: "#fff",
  rightBubbleInfoColor: "#fff",
  rightBubbleColor: "#fff",
  rightUsernameColor: "#fff",
  rightTextColor: "#fff",

  replyBackground: "#00000010",
  replyBorder: "blue",

  systemMessageColor: "#fff",
  systemMessageBackground: "transparent",

  dateColor: "#fff",
  dateBackground: "transparent",

  scrollToBottomIconFill: "#000",
  scrollToBottomBackground: "#fff",
  scrollToBottomShadowColor: "#000",

  loadEarlierBackground: "#b2b2b2",
  loadEarlierColor: "#fff",

  replyIconColor: "#fff",
};

export const ChatThemeContext = createContext<ChatTheme>(defaultChatTheme);

export const useChatTheme = () => useContext<ChatTheme>(ChatThemeContext);

export const ChatThemeProvider: FC<PropsWithChildren<{ theme?: ChatTheme }>> =
  memo(({ children, theme = defaultChatTheme }) => {
    return (
      <ChatThemeContext.Provider value={theme}>
        {children}
      </ChatThemeContext.Provider>
    );
  }, isEqual);
