import { mergeRefs } from "@shared/lib/hooks/merge-refs";
import { useTheme } from "@shared/lib/theme";
import { BottomSheet, Switch, Text, useBottomSheetRef } from "@shared/ui";
import { ChatFeatures, ChatSenderNameMode } from "@shared/ui/chat-view";
import React, { forwardRef } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

/**
 * Шит настроек чата: открывается по шестерёнке в шапке через ref
 * (`present()`), закрывается сам — крест, свайп или кнопка «Готово».
 * Переключает фичи (`ChatFeatures`) — те же пропы, что уходят в ChatView.
 */

interface IChatSettingsModalProps {
  features: ChatFeatures;
  onUpdate: (patch: Partial<ChatFeatures>) => void;
  /**
   * Восстанавливать ли позицию скролла при следующем открытии чата.
   *
   * Отдельным пропом, а не полем `features`: это поведение демо-экрана
   * (он сохраняет якорь в MMKV), а не настройка самого ChatView.
   */
  isScrollRestoreEnabled: boolean;
  onScrollRestoreToggle: (enabled: boolean) => void;
  /** Вызывается при закрытии шита (свайп/бэкдроп/крест/кнопка). */
  onClose?: () => void;
}

type BooleanFeatureKey =
  | "showMessageStatus"
  | "showTimestamp"
  | "showEditedMark"
  | "showReactions"
  | "showReplyPreview"
  | "showForwardedMark"
  | "showThreadIndicator"
  | "showAvatars"
  | "linkDetectionEnabled"
  | "showFab"
  | "showFloatingDate"
  | "showDateSeparators"
  | "showTopLoadingIndicator"
  | "showBottomLoadingIndicator"
  | "showEmptyState"
  | "showInputBar"
  | "showAttachButton"
  | "showVoiceRecording"
  | "contextMenuEnabled"
  | "autoScrollOnNewMessage"
  | "disintegrationEnabled";

const FEATURE_TOGGLES: { key: BooleanFeatureKey; title: string }[] = [
  { key: "showMessageStatus", title: "Статус сообщения" },
  { key: "showTimestamp", title: "Время сообщения" },
  { key: "showEditedMark", title: "Метка «изм.»" },
  { key: "showReactions", title: "Реакции" },
  { key: "showReplyPreview", title: "Превью ответа" },
  { key: "showForwardedMark", title: "Метка «переслано»" },
  { key: "showThreadIndicator", title: "Индикатор треда" },
  { key: "showAvatars", title: "Аватарки" },
  { key: "linkDetectionEnabled", title: "Ссылки и телефоны" },
  { key: "showFab", title: "Кнопка «вниз»" },
  { key: "showFloatingDate", title: "Плавающая дата" },
  { key: "showDateSeparators", title: "Разделители дат" },
  { key: "showTopLoadingIndicator", title: "Спиннер сверху" },
  { key: "showBottomLoadingIndicator", title: "Спиннер снизу" },
  { key: "showEmptyState", title: "Пустое состояние" },
  { key: "showInputBar", title: "Панель ввода" },
  { key: "showAttachButton", title: "Кнопка вложений" },
  { key: "showVoiceRecording", title: "Запись голоса" },
  { key: "contextMenuEnabled", title: "Контекстное меню" },
  { key: "autoScrollOnNewMessage", title: "Автоскролл на новое" },
  { key: "disintegrationEnabled", title: "Эффект распада" },
];

const SENDER_NAME_MODES: { value: ChatSenderNameMode; label: string }[] = [
  { value: "never", label: "Никогда" },
  { value: "incomingOnly", label: "Входящие" },
  { value: "always", label: "Всегда" },
];

export const ChatSettingsModal = forwardRef<
  BottomSheet,
  IChatSettingsModalProps
>(
  (
    {
      features,
      onUpdate,
      isScrollRestoreEnabled,
      onScrollRestoreToggle,
      onClose,
    },
    ref,
  ) => {
    const { colors } = useTheme();
    const sheetRef = useBottomSheetRef();

    return (
      <BottomSheet
        ref={mergeRefs([ref, sheetRef])}
        haptic
        snapPoints={["50%"]}
        enableDynamicSizing={false}
        enablePanDownToClose
        onDismiss={onClose}
      >
        <BottomSheet.Header
          label="Настройки чата"
          onClose={() => sheetRef.current?.dismiss()}
        />

        <BottomSheet.Content>
          <View style={styles.section}>
            <Text textStyle="Caption_M2" color="textSecondary">
              Имя отправителя
            </Text>

            <View style={styles.modeRow}>
              {SENDER_NAME_MODES.map(mode => {
                const isActive = features.senderNameMode === mode.value;

                return (
                  <TouchableOpacity
                    key={mode.value}
                    activeOpacity={0.7}
                    style={[
                      styles.modeButton,
                      {
                        backgroundColor: isActive
                          ? colors.blue500
                          : colors.gray100,
                      },
                    ]}
                    onPress={() => onUpdate({ senderNameMode: mode.value })}
                  >
                    <Text
                      textStyle="Body_S1"
                      color={isActive ? "white" : "textSecondary"}
                    >
                      {mode.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.row}>
            <Text textStyle="Body_M1" color="textPrimary">
              {"Восстанавливать позицию"}
            </Text>
            <Switch
              isActive={isScrollRestoreEnabled}
              onChange={onScrollRestoreToggle}
            />
          </View>

          {FEATURE_TOGGLES.map(({ key, title }) => (
            <View key={key} style={styles.row}>
              <Text textStyle="Body_M1" color="textPrimary">
                {title}
              </Text>
              <Switch
                isActive={!!features[key]}
                onChange={value => onUpdate({ [key]: value })}
              />
            </View>
          ))}
        </BottomSheet.Content>

        <BottomSheet.Footer>
          <BottomSheet.Footer.PrimaryButton
            title="Готово"
            onPress={() => sheetRef.current?.dismiss()}
          />
        </BottomSheet.Footer>
      </BottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  section: {
    marginBottom: 8,
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  modeButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
});
