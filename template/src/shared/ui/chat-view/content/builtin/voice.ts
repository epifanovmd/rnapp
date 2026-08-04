import { VoiceContent } from "../../components/content";
import { ChatMessage } from "../../types";
import { IChatVoiceContent } from "../content-types";
import { defineChatContent } from "../define-content";

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
  sizing: {
    minWidth: ({ layout }) =>
      layout.voicePlaySize +
      layout.voiceContentSpacing +
      layout.voiceWaveformWidth +
      layout.voiceWaveformTrailingInset +
      layout.bubbleHPad * 2,
  },
  preview: () => "🎤 Голосовое сообщение",
});
