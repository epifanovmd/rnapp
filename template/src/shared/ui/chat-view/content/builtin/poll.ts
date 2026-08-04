import { PollContent } from "../../components/content";
import { ChatMessage } from "../../types";
import { IChatPollContent } from "../content-types";
import { defineChatContent } from "../define-content";

export const pollContent = defineChatContent({
  id: "builtin.poll",
  priority: 40,
  parse: (message: ChatMessage): IChatPollContent | undefined =>
    message.poll ? { poll: message.poll } : undefined,
  Component: PollContent,
  preview: content => `📊 ${content.poll.question}`,
});
