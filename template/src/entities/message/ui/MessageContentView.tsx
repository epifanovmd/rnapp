import React, { FC, memo } from "react";

import {
  IChatMessage,
  MessageContent,
  MessageContentOf,
  MessageKind,
} from "../model/message.types";
import { ImageMessageContent } from "./contents/ImageMessageContent";
import { TextMessageContent } from "./contents/TextMessageContent";
import { IMessageColors } from "./useMessageColors";

/**
 * Реестр представлений содержимого.
 *
 * Единственное место, где вид сообщения превращается в разметку и в сводку для
 * цитаты. Новый вид — ветка в `MessageContent`, компонент в `ui/contents` и
 * строка здесь; список, цитаты и панель ответа не меняются.
 */

/** Представление одного вида содержимого. */
interface IMessageContentPresentation<TKind extends MessageKind> {
  View: FC<{ content: MessageContentOf<TKind>; colors: IMessageColors }>;
  /** Однострочная сводка: цитата, панель ответа, превью чата. */
  preview: (content: MessageContentOf<TKind>) => string;
  /** Содержимое правится текстом. */
  isEditable: boolean;
}

/** Тот же реестр без привязки к виду — для чтения по вычисленному ключу. */
interface IAnyMessageContentPresentation {
  View: FC<{ content: any; colors: IMessageColors }>;
  preview: (content: any) => string;
  isEditable: boolean;
}

const MESSAGE_CONTENTS: {
  [TKind in MessageKind]: IMessageContentPresentation<TKind>;
} = {
  text: {
    View: TextMessageContent,
    preview: content => content.text,
    isEditable: true,
  },
  image: {
    View: ImageMessageContent,
    preview: content => content.caption || "Фото",
    isEditable: false,
  },
};

const presentationOf = (kind: MessageKind): IAnyMessageContentPresentation =>
  MESSAGE_CONTENTS[kind];

/** Сводка сообщения одной строкой. */
export const messagePreview = (message: IChatMessage): string =>
  presentationOf(message.content.kind).preview(message.content);

/** Можно ли править сообщение текстом. */
export const isMessageEditable = (message: IChatMessage): boolean =>
  presentationOf(message.content.kind).isEditable;

/** Текст сообщения для поля ввода при правке; у неправимых видов — пусто. */
export const messageEditableText = (message: IChatMessage): string =>
  message.content.kind === "text" ? message.content.text : "";

export interface IMessageContentViewProps {
  content: MessageContent;
  colors: IMessageColors;
}

/** Содержимое сообщения: представление выбирается по виду. */
export const MessageContentView: FC<IMessageContentViewProps> = memo(
  ({ content, colors }) => {
    const { View } = presentationOf(content.kind);

    return <View content={content} colors={colors} />;
  },
);

MessageContentView.displayName = "MessageContentView";
