import {
  IPlateScanResult,
  PlateScanCamera,
  usePlateScanVM,
} from "@features/plate-scan";
import { StackProps } from "@shared/lib/navigation";
import {
  BottomSheet,
  Button,
  Col,
  Container,
  Content,
  Navbar,
  Row,
  ScrollView,
  Text,
  useBottomSheetRef,
} from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC, useCallback, useState } from "react";
import { StyleSheet } from "react-native";

interface IProps extends StackProps<"PlateScanner"> {}

/**
 * Сканер российских автономеров: камера в BottomSheet, при стабильном
 * распознавании лист закрывается и номер выводится на странице.
 */
export const PlateScanner: FC<IProps> = observer(({ route }) => {
  const sheetRef = useBottomSheetRef();
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [lastResult, setLastResult] = useState<IPlateScanResult | null>(null);

  const handleRecognized = useCallback(
    (result: IPlateScanResult) => {
      setLastResult(result);
      sheetRef.current?.dismiss();
    },
    [sheetRef],
  );

  const vm = usePlateScanVM({ onRecognized: handleRecognized });

  const openScanner = useCallback(() => {
    vm.restartScan();
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
            Наведите камеру на номерной знак — номер распознаётся на лету и
            проверяется на формат ГОСТ (буква, три цифры, две буквы, регион).
          </Text>

          <Button
            mt={16}
            title={lastResult ? "Сканировать ещё раз" : "Сканировать"}
            onPress={openScanner}
          />

          {lastResult && (
            <Col mt={24} bg={"surface"} radius={16} pa={16}>
              <Text textStyle={"Title_XXL"}>{lastResult.formatted}</Text>
              <ResultRow label={"Регион"} value={lastResult.parts.region} />
              <ResultRow
                label={"Уверенность OCR"}
                value={`${Math.round(lastResult.confidence * 100)}%`}
              />
            </Col>
          )}
        </Content>
      </ScrollView>

      <BottomSheet
        ref={sheetRef}
        enableDynamicSizing={true}
        onDismiss={handleDismiss}
      >
        <BottomSheet.Header label={"Наведите камеру на номер"} />
        <BottomSheet.Content scrollEnabled={false}>
          <PlateScanCamera
            vm={vm}
            isActive={isSheetOpen}
            style={styles.camera}
          />
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

const ResultRow: FC<{ label: string; value: string }> = ({ label, value }) => (
  <Row mt={12} justifyContent={"space-between"} alignItems={"center"}>
    <Text color={"textSecondary"}>{label}</Text>
    <Text ml={12} flexShrink={1} textAlign={"right"}>
      {value}
    </Text>
  </Row>
);

const styles = StyleSheet.create({
  camera: {
    minHeight: 320,
    borderRadius: 16,
  },
});
