import { ObjectScanCamera, useObjectScanVM } from "@features/object-scan";
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
import { Dimensions, StyleSheet } from "react-native";

interface IProps extends StackProps<"ObjectScanner"> {}

/**
 * Пример «чистой» детекции объектов моделью из папок моделей приложения:
 * камера в BottomSheet, найденные объекты обновляются на лету; после
 * закрытия листа последний список остаётся на странице.
 */
export const ObjectScanner: FC<IProps> = observer(({ route }) => {
  const sheetRef = useBottomSheetRef();
  const [isSheetOpen, setSheetOpen] = useState(false);

  const vm = useObjectScanVM();

  const openScanner = useCallback(() => {
    vm.clearDetections();
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
            Детекция объектов моделью «object_detector» (YOLO в CoreML/TFLite,
            кладётся в те же папки, что модели сканеров). Для предобученной
            COCO-модели метки — 80 стандартных классов.
          </Text>

          <Button mt={16} title={"Найти объекты"} onPress={openScanner} />

          {vm.detections.length > 0 && (
            <Col mt={24} bg={"surface"} radius={16} pa={16}>
              {vm.detections.map((detection, index) => (
                <Row
                  key={`${index}-${detection.label}`}
                  mt={index > 0 ? 8 : 0}
                  justifyContent={"space-between"}
                >
                  <Text>{detection.label}</Text>
                  <Text color={"textSecondary"}>
                    {Math.round(detection.score * 100)}%
                  </Text>
                </Row>
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
        <BottomSheet.Header label={"Наведите камеру на объекты"} />
        <BottomSheet.Content scrollEnabled={false}>
          <ObjectScanCamera
            vm={vm}
            isActive={isSheetOpen}
            style={styles.camera}
          />
          <Col mt={8} ph={4} height={64}>
            <Text color={"textSecondary"} numberOfLines={3}>
              {vm.detections.length > 0
                ? vm.detections
                    .map(
                      detection =>
                        `${detection.label} ${Math.round(detection.score * 100)}%`,
                    )
                    .join("  ·  ")
                : "Объекты пока не найдены…"}
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
    minHeight: 600,
    borderRadius: 16,
  },
});
