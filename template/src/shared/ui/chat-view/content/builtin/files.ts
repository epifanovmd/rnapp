import { FilesContent } from "../../components/content";
import { ChatMessage } from "../../types";
import { IChatFilesContent } from "../content-types";
import { defineChatContent } from "../define-content";

/** `files` имеет приоритет над одиночным `file`. */
const parseFiles = (message: ChatMessage): IChatFilesContent | undefined => {
  const items = message.files ?? (message.file ? [message.file] : undefined);

  return items && items.length > 0 ? { items } : undefined;
};

export const filesContent = defineChatContent({
  id: "builtin.files",
  priority: 30,
  parse: parseFiles,
  Component: FilesContent,
  preview: content =>
    content.items.length === 1 ? `📎 ${content.items[0].name}` : "📎 Файлы",
});
