import { IContainerScanResult } from "@features/container-scan";
import { decodeEquipmentCategory } from "@shared/lib/container-ocr";
import { Col, FlexProps, Row, Text } from "@shared/ui";
import React, { FC, memo } from "react";

interface IProps extends FlexProps {
  result: IContainerScanResult;
}

/** Карточка распознанного контейнера: посимвольная расшифровка по ISO 6346 */
export const ScanResultCard: FC<IProps> = memo(({ result, ...rest }) => {
  const { parts, candidate, sizeType, attributes } = result;
  const { maxGrossKg, tareKg, netKg, cubicCapacityM3 } = attributes.weights;

  return (
    <Col bg={"surface"} radius={16} pa={16} {...rest}>
      <Text textStyle={"Title_XL"}>{result.formatted}</Text>
      <Text mt={4} color={"green600"} textStyle={"Caption_M2"}>
        Контрольная цифра сходится (ISO 6346)
      </Text>

      <SectionTitle title={"Разбор кода"} />
      <DecodeRow
        fragment={parts.owner}
        meaning={"Код владельца (BIC)"}
        detail={result.ownerName ?? "владелец не найден в справочнике"}
      />
      <DecodeRow
        fragment={parts.category}
        meaning={"Категория оборудования"}
        detail={decodeEquipmentCategory(parts.category)}
      />
      <DecodeRow
        fragment={parts.serial}
        meaning={"Серийный номер"}
        detail={"присваивается владельцем"}
      />
      <DecodeRow
        fragment={`${parts.checkDigit}`}
        meaning={"Контрольная цифра"}
        detail={"вычисляется по первым 10 знакам"}
      />

      {sizeType && (
        <>
          <SectionTitle title={`Типоразмер ${sizeType.code}`} />
          <DecodeRow
            fragment={sizeType.lengthCode}
            meaning={"Длина"}
            detail={sizeType.length}
          />
          <DecodeRow
            fragment={sizeType.heightCode}
            meaning={"Высота"}
            detail={sizeType.height}
          />
          <DecodeRow
            fragment={sizeType.typeCode}
            meaning={sizeType.typeGroup}
            detail={sizeType.typeDetail}
          />
        </>
      )}

      <SectionTitle title={"Веса и объём"} />
      {maxGrossKg !== null && (
        <ResultRow label={"MAX GROSS (брутто)"} value={formatKg(maxGrossKg)} />
      )}
      {tareKg !== null && (
        <ResultRow label={"TARE (собственный)"} value={formatKg(tareKg)} />
      )}
      {netKg !== null && (
        <ResultRow label={"NET / PAYLOAD (груз)"} value={formatKg(netKg)} />
      )}
      {cubicCapacityM3 !== null && (
        <ResultRow label={"CU CAP (объём)"} value={`${cubicCapacityM3} м³`} />
      )}

      <ResultRow
        label={"Уверенность OCR"}
        value={`${Math.round(candidate.confidence * 100)}%`}
      />
    </Col>
  );
});

const SectionTitle: FC<{ title: string }> = memo(({ title }) => (
  <Text mt={16} textStyle={"Title_S1"}>
    {title}
  </Text>
));

/** Строка посимвольного разбора: фрагмент кода → что означает */
const DecodeRow: FC<{ fragment: string; meaning: string; detail: string }> =
  memo(({ fragment, meaning, detail }) => (
    <Row mt={10} alignItems={"flex-start"}>
      <Col
        minWidth={64}
        pv={2}
        ph={8}
        radius={6}
        bg={"onSurface"}
        alignItems={"center"}
      >
        <Text textStyle={"Body_S1"}>{fragment}</Text>
      </Col>
      <Col ml={12} flex={1}>
        <Text>{meaning}</Text>
        <Text mt={2} color={"textSecondary"} textStyle={"Caption_M2"}>
          {detail}
        </Text>
      </Col>
    </Row>
  ));

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
