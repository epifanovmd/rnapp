import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import {
  GestureDetector,
  useCompetingGestures,
  usePanGesture,
  useTapGesture,
} from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";

import { useChatViewContext } from "../../../model";
import { chatVoicePlayer } from "../../../services";
import { ChatMessageOwnership } from "../../../types";
import { withOpacity } from "../../../utils";
import { ChatIcon } from "../../ChatIcon";
import { LoadingRing } from "../../LoadingRing";
import { VoiceTimer } from "./VoiceTimer";
import { VoiceWaveform } from "./VoiceWaveform";
import { normalizeWaveform, resampleWaveform } from "./waveform-math";

/**
 * Голосовое сообщение: кнопка play/pause с кольцом загрузки и повтором при
 * ошибке, волновая форма с перемоткой и таймер.
 *
 * Состояние плеера читается **по одному треку и примитивами**: прогресс уходит
 * в shared value и двигает столбики на UI-потоке, таймер округлён до секунды.
 * Иначе каждое голосовое на экране перерисовывалось бы 20 раз в секунду при
 * воспроизведении любого другого.
 */

interface IVoiceContentProps {
  url: string;
  duration: number;
  waveform: number[];
  ownership: ChatMessageOwnership;
}

export const VoiceContent: FC<IVoiceContentProps> = memo(
  ({ url, duration, waveform, ownership }) => {
    const { theme, layout, styles } = useChatViewContext();
    const s = styles.byOwnership[ownership];

    const status = useSyncExternalStore(
      chatVoicePlayer.subscribe,
      useCallback(() => chatVoicePlayer.getStatus(url), [url]),
    );

    const isLoading = status === "loading";
    const isFailed = status === "failed";
    const isPlaying = status === "playing";
    const isActive = isPlaying || status === "paused";

    const [waveWidth, setWaveWidth] = useState(0);
    const progress = useSharedValue(0);
    const isSeekingRef = useRef(false);
    const waveWidthRef = useRef(0);

    waveWidthRef.current = waveWidth;

    // Прогресс плеера едет в shared value: React о нём не знает.
    useEffect(
      () =>
        chatVoicePlayer.subscribe(() => {
          if (isSeekingRef.current) return;
          progress.value = chatVoicePlayer.getProgress(url);
        }),
      [url, progress],
    );

    const btnSize = layout.voicePlaySize;
    const durationLineHeight = layout.voiceDurationFont.fontSize * 1.2;
    const waveHeight = btnSize - durationLineHeight - 2;
    const barTotal = layout.voiceBarWidth + layout.voiceBarSpacing;
    const barCount = waveWidth > 0 ? Math.floor(waveWidth / barTotal) : 0;

    const bars = useMemo(
      () =>
        barCount > 0
          ? resampleWaveform(normalizeWaveform(waveform), barCount)
          : [],
      [waveform, barCount],
    );

    const handleWaveLayout = useCallback(
      (e: LayoutChangeEvent) => setWaveWidth(e.nativeEvent.layout.width),
      [],
    );

    const handlePlayTap = useCallback(
      () => chatVoicePlayer.toggle(url, duration),
      [url, duration],
    );

    const updateSeek = useCallback(
      (x: number) => {
        const width = waveWidthRef.current;

        if (width <= 0) return;

        isSeekingRef.current = true;
        progress.value = Math.max(0, Math.min(1, x / width));
      },
      [progress],
    );

    const commitSeek = useCallback(
      (x: number) => {
        const width = waveWidthRef.current;

        if (width <= 0) return;

        const value = Math.max(0, Math.min(1, x / width));

        isSeekingRef.current = false;
        progress.value = value;
        chatVoicePlayer.seek(value);
      },
      [progress],
    );

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

    const buttonStyle = useMemo(
      () =>
        isFailed
          ? [
              s.voicePlayButton,
              { backgroundColor: withOpacity(s.voiceAccent, 0.4) },
            ]
          : s.voicePlayButton,
      [isFailed, s],
    );

    return (
      <View style={[ss.container, { height: btnSize + 12 }]}>
        <Pressable style={buttonStyle} onPress={handlePlayTap}>
          <View style={isLoading ? ss.iconDimmed : undefined}>
            <ChatIcon
              name={
                isFailed
                  ? "arrow.clockwise"
                  : isPlaying
                    ? "pause.fill"
                    : "play.fill"
              }
              size={layout.voicePlayIconSize}
              color="#FFFFFF"
            />
          </View>
          {isLoading && <LoadingRing size={btnSize} color="#FFFFFF" />}
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
              style={[ss.waveform, { height: waveHeight }]}
              onLayout={handleWaveLayout}
            >
              <VoiceWaveform
                bars={bars}
                barWidth={layout.voiceBarWidth}
                barTotal={barTotal}
                minHeight={layout.voiceBarMinHeight}
                height={waveHeight}
                activeColor={s.voiceAccent}
                inactiveColor={theme.voiceWaveformInactive}
                progress={progress}
                isActive={isActive}
                isDimmed={isFailed}
              />
            </View>
          </GestureDetector>
          <VoiceTimer url={url} duration={duration} ownership={ownership} />
        </View>
      </View>
    );
  },
);

VoiceContent.displayName = "VoiceContent";

const ss = StyleSheet.create({
  container: { flexDirection: "row" },
  right: { flex: 1 },
  waveform: { alignSelf: "stretch", marginTop: 8 },
  iconDimmed: { opacity: 0.3 },
});
