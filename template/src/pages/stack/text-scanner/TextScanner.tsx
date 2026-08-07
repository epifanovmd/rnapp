import { TextScanCamera, useTextScanVM } from "@features/text-scan";
import { StackProps } from "@shared/lib/navigation";
import {
  BottomSheet,
  Button,
  Col,
  Container,
  Content,
  Navbar,
  ScrollView,
  Text,
  useBottomSheetRef,
} from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC, useCallback, useState } from "react";
import { StyleSheet } from "react-native";

interface IProps extends StackProps<"TextScanner"> {}

/**
 * Распознавание произвольного текста: камера в BottomSheet, распознанные
 * строки обновляются на лету; после закрытия листа последний результат
 * остаётся на странице.
 */
export const TextScanner: FC<IProps> = observer(({ route }) => {
  const sheetRef = useBottomSheetRef();
  const [isSheetOpen, setSheetOpen] = useState(false);

  const vm = useTextScanVM();

  const openScanner = useCallback(() => {
    vm.clearLines();
    setSheetOpen(true);
    sheetRef.current?.present();
  }, [sheetRef, vm]);

  const handleDismiss = useCallback(() => {
    setSheetOpen(false);
  }, []);

  const closeSheet = useCallback(() => {
    sheetRef.current?.dismiss();
  }, [sheetRef]);

  return (
    <Container edges={["top"]}>
      <Navbar>
        <Navbar.BackButton />
        <Navbar.Title text={route.name} />
      </Navbar>

      <ScrollView>
        <Content>
          <Text mt={8} color={"textSecondary"}>
            Наведите камеру на любой текст — распознанные строки выводятся на
            лету. Закройте лист, чтобы зафиксировать результат.
          </Text>

          <Button mt={16} title={"Сканировать текст"} onPress={openScanner} />

          {vm.lines.length > 0 && (
            <Col mt={24} bg={"surface"} radius={16} pa={16}>
              {vm.lines.map((line, index) => (
                <Text key={`${index}-${line}`} mt={index > 0 ? 6 : 0}>
                  {line}
                </Text>
              ))}
            </Col>
          )}
        </Content>
      </ScrollView>

      <BottomSheet
        ref={sheetRef}
        enableDynamicSizing={true}
        onDismiss={handleDismiss}
      >
        <BottomSheet.Header label={"Наведите камеру на текст"} />
        <BottomSheet.Content scrollEnabled={false}>
          <TextScanCamera
            vm={vm}
            isActive={isSheetOpen}
            style={styles.camera}
          />
          <Col mt={8} ph={4} height={64}>
            <Text color={"textSecondary"} numberOfLines={3}>
              {vm.lines.length > 0
                ? vm.lines.join("  ·  ")
                : "Текст пока не распознан…"}
            </Text>
          </Col>
        </BottomSheet.Content>

        <BottomSheet.Footer>
          <BottomSheet.Footer.PrimaryButton
            title={"Готово"}
            onPress={closeSheet}
          />
        </BottomSheet.Footer>
      </BottomSheet>
    </Container>
  );
});

const styles = StyleSheet.create({
  camera: {
    minHeight: 280,
    borderRadius: 16,
  },
});
