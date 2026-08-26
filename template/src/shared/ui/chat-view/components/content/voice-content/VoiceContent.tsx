import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
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

import { IChatContentProps, IChatVoiceContent } from "../../../content";
import { useChatViewContext } from "../../../model";
import { chatVoicePlayer } from "../../../services";
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
 * Состояние плеера читается примитивами: прогресс — в shared value на UI-потоке,
 * таймер округлён до секунды. Это исключает лишние ре-рендеры при воспроизведении.
 */

/** Кнопка play, полоска волны и её шаг. */
const PLAY_SIZE = 36;
const BAR_WIDTH = 2.5;
const BAR_TOTAL = 4.5;

/** Волна занимает высоту кнопки минус строка таймера. */
const WAVE_HEIGHT = 19.6;

export const VoiceContent: FC<IChatContentProps<IChatVoiceContent>> = memo(
  ({ content, messageId, ownership }) => {
    const { colors, styles } = useChatViewContext();
    const s = styles.byOwnership[ownership];

    const { url, duration, waveform } = content;

    const status = useSyncExternalStore(
      chatVoicePlayer.subscribe,
      useCallback(() => chatVoicePlayer.getStatus(messageId), [messageId]),
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

    // Ячейка переиспользована под другую запись: состояние плеера сбрасывается
    // на месте, без пересоздания поддерева. Layout-эффект, а не рендер: писать
    // в shared value во время рендера нельзя, а до отрисовки кадра — можно,
    // поэтому чужой прогресс не успевает мелькнуть.
    useLayoutEffect(() => {
      progress.value = chatVoicePlayer.getProgress(messageId);
      isSeekingRef.current = false;
    }, [messageId, progress]);

    // Прогресс плеера едет в shared value: React о нём не знает.
    useEffect(
      () =>
        chatVoicePlayer.subscribe(() => {
          if (isSeekingRef.current) return;
          progress.value = chatVoicePlayer.getProgress(messageId);
        }),
      [messageId, progress],
    );

    const barCount = waveWidth > 0 ? Math.floor(waveWidth / BAR_TOTAL) : 0;

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
      () => chatVoicePlayer.toggle(messageId, url, duration),
      [messageId, url, duration],
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
      <View style={ss.container}>
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
              size={18}
              color="#FFFFFF"
            />
          </View>
          {isLoading && <LoadingRing size={PLAY_SIZE} color="#FFFFFF" />}
        </Pressable>

        <View style={ss.right}>
          <GestureDetector gesture={seekGesture}>
            <View style={ss.waveform} onLayout={handleWaveLayout}>
              <VoiceWaveform
                bars={bars}
                barWidth={BAR_WIDTH}
                barTotal={BAR_TOTAL}
                minHeight={2}
                height={WAVE_HEIGHT}
                activeColor={s.voiceAccent}
                inactiveColor={colors.voiceWaveformInactive}
                progress={progress}
                isActive={isActive}
                isDimmed={isFailed}
              />
            </View>
          </GestureDetector>
          <VoiceTimer
            messageId={messageId}
            duration={duration}
            ownership={ownership}
          />
        </View>
      </View>
    );
  },
);

VoiceContent.displayName = "VoiceContent";

const ss = StyleSheet.create({
  container: { flexDirection: "row", height: PLAY_SIZE + 12 },
  right: { flex: 1, marginLeft: 10, marginRight: 8 },
  waveform: { alignSelf: "stretch", marginTop: 8, height: WAVE_HEIGHT },
  iconDimmed: { opacity: 0.3 },
});
