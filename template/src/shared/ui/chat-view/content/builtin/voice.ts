import { VoiceContent } from "../../components/content";
import { ChatMessage } from "../../types";
import { IChatVoiceContent } from "../content-types";
import { defineChatContent } from "../define-content";

/** Кнопка (36) + отступ (10) + волна (140) + её поле (8) + паддинги (24). */
const VOICE_MIN_BUBBLE_WIDTH = 218;

const parseVoice = (message: ChatMessage): IChatVoiceContent | undefined => {
  const voice = message.voice;

  if (!voice) return undefined;

  return {
    url: voice.url,
    duration: voice.duration ?? 0,
    waveform: voice.waveform ?? [],
  };
};

export const voiceContent = defineChatContent({
  id: "builtin.voice",
  priority: 20,
  parse: parseVoice,
  Component: VoiceContent,
  // Голосовое сжимает пузырь по своему контенту: кнопка, волна и отступы.
  sizing: { minWidth: () => VOICE_MIN_BUBBLE_WIDTH },
  preview: () => "🎤 Голосовое сообщение",
});
