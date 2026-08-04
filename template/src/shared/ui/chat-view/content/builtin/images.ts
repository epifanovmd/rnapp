import { MediaGridContent } from "../../components/content";
import { ChatMessage } from "../../types";
import { IChatImagesContent, IChatMediaItem } from "../content-types";
import { defineChatContent } from "../define-content";

/** Изображения и видео сообщения — одной сеткой, видео последним. */
const parseImages = (message: ChatMessage): IChatImagesContent | undefined => {
  const items: IChatMediaItem[] = [];

  for (const img of message.images ?? []) {
    items.push({
      isVideo: false,
      url: img.url,
      thumbnailUrl: img.thumbnailUrl ?? img.url,
      width: img.width,
      height: img.height,
    });
  }

  if (message.video) {
    items.push({
      isVideo: true,
      url: message.video.url,
      thumbnailUrl: message.video.thumbnailUrl,
      width: message.video.width,
      height: message.video.height,
      duration: message.video.duration,
    });
  }

  return items.length > 0 ? { items } : undefined;
};

export const imagesContent = defineChatContent({
  id: "builtin.images",
  priority: 10,
  parse: parseImages,
  Component: MediaGridContent,
  preview: content =>
    content.items.every(item => item.isVideo) ? "🎬 Видео" : "📷 Фото",
});
