import { IContainerScanResult } from "@features/container-scan";
import { Col, FlexProps, Row, Text } from "@shared/ui";
import React, { FC, memo } from "react";

const EQUIPMENT_CATEGORIES: Record<string, string> = {
  U: "Грузовой контейнер (freight container)",
  J: "Съёмное оборудование (detachable equipment)",
  Z: "Шасси / трейлер (chassis / trailer)",
};

interface IProps extends FlexProps {
  result: IContainerScanResult;
}

/** Карточка распознанного кода контейнера с расшифровкой по ISO 6346 */
export const ScanResultCard: FC<IProps> = memo(({ result, ...rest }) => {
  const { parts, candidate, sizeType, attributes } = result;
  const { maxGrossKg, tareKg, netKg, cubicCapacityM3 } = attributes.weights;

  return (
    <Col bg={"surface"} radius={16} pa={16} {...rest}>
      <Text textStyle={"Title_XL"}>{result.formatted}</Text>
      <Text mt={4} color={"green600"} textStyle={"Caption_M2"}>
        Контрольная цифра сходится (ISO 6346)
      </Text>

      <ResultRow label={"Владелец"} value={result.ownerName ?? parts.owner} />
      <ResultRow
        label={"Категория"}
        value={EQUIPMENT_CATEGORIES[parts.category] ?? parts.category}
      />
      <ResultRow label={"Серийный номер"} value={parts.serial} />
      <ResultRow label={"Контрольная цифра"} value={`${parts.checkDigit}`} />

      {sizeType && (
        <>
          <ResultRow
            label={"Типоразмер"}
            value={`${sizeType.code} — ${sizeType.length}, ${sizeType.height}`}
          />
          <ResultRow label={"Тип"} value={sizeType.type} />
        </>
      )}
      {!sizeType && attributes.sizeTypeCode !== null && (
        <ResultRow label={"Типоразмер"} value={attributes.sizeTypeCode} />
      )}

      {maxGrossKg !== null && (
        <ResultRow label={"MAX GROSS"} value={formatKg(maxGrossKg)} />
      )}
      {tareKg !== null && <ResultRow label={"TARE"} value={formatKg(tareKg)} />}
      {netKg !== null && (
        <ResultRow label={"NET / PAYLOAD"} value={formatKg(netKg)} />
      )}
      {cubicCapacityM3 !== null && (
        <ResultRow label={"Объём"} value={`${cubicCapacityM3} м³`} />
      )}

      <ResultRow
        label={"Уверенность OCR"}
        value={`${Math.round(candidate.confidence * 100)}%`}
      />
    </Col>
  );
});

const ResultRow: FC<{ label: string; value: string }> = memo(
  ({ label, value }) => (
    <Row mt={12} justifyContent={"space-between"} alignItems={"center"}>
      <Text color={"textSecondary"}>{label}</Text>
      <Text ml={12} flexShrink={1} textAlign={"right"}>
        {value}
      </Text>
    </Row>
  ),
);

/** 30480 → "30 480 кг" */
function formatKg(value: number): string {
  const rounded = Math.round(value);

  return `${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} кг`;
}
