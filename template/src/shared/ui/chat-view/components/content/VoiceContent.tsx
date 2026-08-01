import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  GestureDetector,
  useCompetingGestures,
  usePanGesture,
  useTapGesture,
} from "react-native-gesture-handler";

import {
  chatTextBase,
  chatVoicePlayer,
  ChatVoicePlayerState,
  formatChatDuration,
} from "../../model";
import { ChatMessageOwnership } from "../../types";
import { useChatViewContext } from "../chat-view-context";
import { ChatIcon } from "../ChatIcon";

/**
 * Порт VoiceContentView + WaveformView: кнопка play/pause, волновая форма
 * с перемоткой (pan/tap, только когда это голосовое активно), таймер.
 */

interface IVoiceContentProps {
  messageId: string;
  url: string;
  duration: number;
  waveform: number[];
  ownership: ChatMessageOwnership;
}

/**
 * Порт WaveformView.normalize: приводит амплитуды к 0…1 по максимуму —
 * источник (рекордер, сервер) может отдавать произвольную шкалу, иначе
 * столбики вылезают за область волны и обрезаются краем пузыря.
 */
const normalize = (data: number[]): number[] => {
  let peak = 0;

  for (const value of data) {
    peak = Math.max(peak, Math.abs(value));
  }

  if (peak <= 0) return data.map(() => 0);

  return data.map(value => Math.min(Math.abs(value) / peak, 1));
};

const resample = (data: number[], count: number): number[] => {
  if (data.length === 0) return new Array(count).fill(0.3);

  const result: number[] = [];

  for (let i = 0; i < count; i++) {
    const idx = (i / count) * data.length;
    const lower = Math.floor(idx);
    const upper = Math.min(lower + 1, data.length - 1);
    const frac = idx - lower;

    result.push(data[lower] * (1 - frac) + data[upper] * frac);
  }

  return result;
};

export const VoiceContent: FC<IVoiceContentProps> = memo(
  ({ url, duration, waveform, ownership }) => {
    const { theme, layout } = useChatViewContext();

    const [playerState, setPlayerState] = useState<ChatVoicePlayerState>(
      chatVoicePlayer.state,
    );
    const [waveWidth, setWaveWidth] = useState(0);
    const [seekProgress, setSeekProgress] = useState<number | null>(null);

    useEffect(() => chatVoicePlayer.addObserver(setPlayerState), []);

    const isMe = playerState.type !== "idle" && playerState.url === url;
    const isLoading = isMe && playerState.type === "loading";
    const isPlaying = isMe && playerState.type === "playing";
    const isActive =
      isMe && (playerState.type === "playing" || playerState.type === "paused");

    const progress =
      seekProgress ??
      (isMe && (playerState.type === "playing" || playerState.type === "paused")
        ? playerState.progress
        : 0);

    const currentTime =
      isMe && (playerState.type === "playing" || playerState.type === "paused")
        ? playerState.currentTime
        : duration;

    const btnSize = layout.voicePlaySize;
    const durationLineHeight = layout.voiceDurationFont.fontSize * 1.2;
    const waveH = btnSize - durationLineHeight - 2;
    const accentColor =
      ownership === "mine"
        ? theme.outgoingStatusRead
        : theme.voiceWaveformActive;

    const barTotal = layout.voiceBarWidth + layout.voiceBarSpacing;
    const barCount = waveWidth > 0 ? Math.floor(waveWidth / barTotal) : 0;

    const bars = useMemo(
      () => (barCount > 0 ? resample(normalize(waveform), barCount) : []),
      [waveform, barCount],
    );

    const handleWaveLayout = useCallback(
      (e: LayoutChangeEvent) => setWaveWidth(e.nativeEvent.layout.width),
      [],
    );

    const handlePlayTap = useCallback(() => {
      chatVoicePlayer.toggle(url, duration);
    }, [url, duration]);

    const waveWidthRef = useRef(0);

    waveWidthRef.current = waveWidth;

    const commitSeek = useCallback((x: number) => {
      const width = waveWidthRef.current;

      if (width <= 0) return;

      const clamped = Math.max(0, Math.min(1, x / width));

      setSeekProgress(null);
      chatVoicePlayer.seek(clamped);
    }, []);

    const updateSeek = useCallback((x: number) => {
      const width = waveWidthRef.current;

      if (width <= 0) return;

      setSeekProgress(Math.max(0, Math.min(1, x / width)));
    }, []);

    const panGesture = usePanGesture({
      enabled: isActive,
      disableReanimated: true,
      activeOffsetX: [-5, 5],
      failOffsetY: [-8, 8],
      onUpdate: e => updateSeek(e.x),
      onDeactivate: e => commitSeek(e.x),
    });

    const tapGesture = useTapGesture({
      enabled: isActive,
      disableReanimated: true,
      onDeactivate: e => {
        if (!e.canceled) commitSeek(e.x);
      },
    });

    const seekGesture = useCompetingGestures(panGesture, tapGesture);

    const activeCount = Math.floor(bars.length * progress);

    return (
      <View style={[ss.container, { height: btnSize + 12 }]}>
        <Pressable
          style={[
            ss.playButton,
            {
              width: btnSize,
              height: btnSize,
              borderRadius: btnSize / 2,
              backgroundColor: accentColor,
            },
          ]}
          onPress={handlePlayTap}
        >
          <ChatIcon
            name={isPlaying ? "pause.fill" : "play.fill"}
            size={layout.voicePlayIconSize}
            color="#FFFFFF"
          />
          {isLoading && (
            <View style={ss.loadingDim} pointerEvents="none">
              <Text style={[chatTextBase, ss.loadingDots]}>•••</Text>
            </View>
          )}
        </Pressable>

        <View
          style={[
            ss.right,
            {
              marginLeft: layout.voiceContentSpacing,
              marginRight: layout.voiceWaveformTrailingInset,
            },
          ]}
        >
          <GestureDetector gesture={seekGesture}>
            <View
              style={[ss.waveform, { height: waveH }]}
              onLayout={handleWaveLayout}
            >
              {bars.map((value, i) => {
                const level = Math.min(Math.max(value, 0), 1);
                const h = Math.max(layout.voiceBarMinHeight, level * waveH);

                return (
                  <View
                    key={i}
                    style={[
                      ss.bar,
                      {
                        left: i * barTotal,
                        width: layout.voiceBarWidth,
                        height: h,
                        borderRadius: layout.voiceBarWidth / 2,
                        backgroundColor:
                          i < activeCount
                            ? accentColor
                            : theme.voiceWaveformInactive,
                      },
                    ]}
                  />
                );
              })}
            </View>
          </GestureDetector>
          <Text
            style={[
              chatTextBase,
              ss.duration,
              {
                fontSize: layout.voiceDurationFont.fontSize,
                fontWeight: layout.voiceDurationFont.fontWeight,
                fontVariant: ["tabular-nums"],
                color:
                  ownership === "mine"
                    ? theme.outgoingTime
                    : theme.incomingTime,
              },
            ]}
          >
            {formatChatDuration(isMe ? currentTime : duration)}
          </Text>
        </View>
      </View>
    );
  },
);

VoiceContent.displayName = "VoiceContent";

const ss = StyleSheet.create({
  container: {
    flexDirection: "row",
  },
  playButton: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  bar: {
    position: "absolute",
    bottom: 0,
  },
  duration: {
    marginTop: 2,
  },
  right: {
    flex: 1,
  },
  waveform: {
    alignSelf: "stretch",
    marginTop: 8,
  },
  loadingDim: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingDots: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
});
