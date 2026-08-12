import {
  ContainerScanCamera,
  IContainerScanResult,
  useContainerScanVM,
} from "@features/container-scan";
import { useRoute } from "@shared/lib/navigation";
import {
  BottomSheet,
  Button,
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

import { ScanResultCard } from "./components";

/**
 * Сканер кода морского контейнера (ISO 6346): камера открывается в
 * BottomSheet, при стабильном распознавании лист закрывается и данные
 * выводятся на странице.
 */
export const ContainerScanner: FC = observer(() => {
  const { name } = useRoute();
  const sheetRef = useBottomSheetRef();
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [lastResult, setLastResult] = useState<IContainerScanResult | null>(
    null,
  );

  const handleRecognized = useCallback(
    (result: IContainerScanResult) => {
      setLastResult(result);
      sheetRef.current?.dismiss();
    },
    [sheetRef],
  );

  const vm = useContainerScanVM({ onRecognized: handleRecognized });

  const openScanner = useCallback(() => {
    vm.restartScan();
    setSheetOpen(true);
    sheetRef.current?.present();
  }, [sheetRef, vm]);

  const handleDismiss = useCallback(() => {
    setSheetOpen(false);
  }, []);

  return (
    <Container edges={["top"]}>
      <Navbar>
        <Navbar.BackButton />
        <Navbar.Title text={name} />
      </Navbar>

      <ScrollView>
        <Content>
          <Text mt={8} color={"textSecondary"}>
            Наведите камеру на код контейнера (например, MSCU 123456-7) — код
            распознаётся на лету, области подсвечиваются прямо на экране.
            Результат подтверждается контрольной цифрой ISO 6346.
          </Text>

          <Button
            mt={16}
            title={lastResult ? "Сканировать ещё раз" : "Сканировать"}
            onPress={openScanner}
          />

          {lastResult && <ScanResultCard mt={24} result={lastResult} />}
        </Content>
      </ScrollView>

      <BottomSheet
        ref={sheetRef}
        enableDynamicSizing={true}
        onDismiss={handleDismiss}
      >
        <BottomSheet.Header label={"Наведите камеру на код контейнера"} />
        <BottomSheet.Content scrollEnabled={false}>
          <ContainerScanCamera
            vm={vm}
            isActive={isSheetOpen}
            style={styles.camera}
          />
        </BottomSheet.Content>
      </BottomSheet>
    </Container>
  );
});

const styles = StyleSheet.create({
  camera: {
    minHeight: 600,
    borderRadius: 16,
  },
});
