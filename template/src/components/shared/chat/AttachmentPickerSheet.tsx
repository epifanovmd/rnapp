import { useTheme } from "@core";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Camera, File, Image, X } from "lucide-react-native";
import React, { FC, useCallback, useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export interface AttachmentPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onCameraPress: () => void;
  onGalleryPress: () => void;
  onFilePress: () => void;
}

export const AttachmentPickerSheet: FC<AttachmentPickerSheetProps> = ({
  visible,
  onClose,
  onCameraPress,
  onGalleryPress,
  onFilePress,
}) => {
  const { colors } = useTheme();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => ["30%"], []);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose],
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    [],
  );

  const handleCamera = useCallback(() => {
    onClose();
    onCameraPress();
  }, [onClose, onCameraPress]);

  const handleGallery = useCallback(() => {
    onClose();
    onGalleryPress();
  }, [onClose, onGalleryPress]);

  const handleFile = useCallback(() => {
    onClose();
    onFilePress();
  }, [onClose, onFilePress]);

  const iconColor = colors.textPrimary;
  const cancelColor = colors.red500;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.surface }}
      handleIndicatorStyle={{ backgroundColor: colors.slate300 }}
    >
      <BottomSheetView style={styles.content}>
        <Pressable
          style={[styles.option, { borderBottomColor: colors.slate200 }]}
          onPress={handleCamera}
        >
          <Camera size={22} color={iconColor} />
          <Text style={[styles.optionText, { color: colors.textPrimary }]}>
            Camera
          </Text>
        </Pressable>

        <Pressable
          style={[styles.option, { borderBottomColor: colors.slate200 }]}
          onPress={handleGallery}
        >
          <Image size={22} color={iconColor} />
          <Text style={[styles.optionText, { color: colors.textPrimary }]}>
            Gallery
          </Text>
        </Pressable>

        <Pressable
          style={[styles.option, { borderBottomColor: colors.slate200 }]}
          onPress={handleFile}
        >
          <File size={22} color={iconColor} />
          <Text style={[styles.optionText, { color: colors.textPrimary }]}>
            File
          </Text>
        </Pressable>

        <Pressable style={styles.option} onPress={onClose}>
          <X size={22} color={cancelColor} />
          <Text style={[styles.optionText, { color: cancelColor }]}>
            Cancel
          </Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "transparent",
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
