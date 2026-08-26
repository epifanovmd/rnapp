import { mergeRefs } from "@shared/lib/hooks/merge-refs";
import { BottomSheet, Switch, Text, useBottomSheetRef } from "@shared/ui";
import React, { forwardRef } from "react";
import { StyleSheet, View } from "react-native";

/**
 * Шит настроек демо-экрана: открывается по шестерёнке в шапке через ref
 * (`present()`), закрывается сам — крест, свайп или кнопка «Готово».
 */

interface IChatSettingsModalProps {
  /**
   * Восстанавливать ли позицию скролла при следующем открытии чата.
   * Это поведение демо-экрана (он сохраняет якорь в MMKV), а не ChatView.
   */
  isScrollRestoreEnabled: boolean;
  onScrollRestoreToggle: (enabled: boolean) => void;
  /** Вызывается при закрытии шита (свайп/бэкдроп/крест/кнопка). */
  onClose?: () => void;
}

export const ChatSettingsModal = forwardRef<
  BottomSheet,
  IChatSettingsModalProps
>(({ isScrollRestoreEnabled, onScrollRestoreToggle, onClose }, ref) => {
  const sheetRef = useBottomSheetRef();

  return (
    <BottomSheet
      ref={mergeRefs([ref, sheetRef])}
      haptic
      enablePanDownToClose
      onDismiss={onClose}
    >
      <BottomSheet.Header
        label="Настройки чата"
        onClose={() => sheetRef.current?.dismiss()}
      />

      <BottomSheet.Content>
        <View style={styles.row}>
          <Text textStyle="Body_M1" color="textPrimary">
            {"Восстанавливать позицию"}
          </Text>
          <Switch
            isActive={isScrollRestoreEnabled}
            onChange={onScrollRestoreToggle}
          />
        </View>
      </BottomSheet.Content>

      <BottomSheet.Footer>
        <BottomSheet.Footer.PrimaryButton
          title="Готово"
          onPress={() => sheetRef.current?.dismiss()}
        />
      </BottomSheet.Footer>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
});
