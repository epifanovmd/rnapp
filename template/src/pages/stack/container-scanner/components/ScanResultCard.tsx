import { IContainerScanResult } from "@features/container-scan";
import { decodeEquipmentCategory } from "@shared/lib/container-ocr";
import { Col, FlexProps, Text } from "@shared/ui";
import React, { FC, memo } from "react";

import { ScanDecodeRow } from "./ScanDecodeRow";
import { ScanResultRow } from "./ScanResultRow";
import { ScanSectionTitle } from "./ScanSectionTitle";

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

      <ScanSectionTitle title={"Разбор кода"} />
      <ScanDecodeRow
        fragment={parts.owner}
        meaning={"Код владельца (BIC)"}
        detail={result.ownerName ?? "владелец не найден в справочнике"}
      />
      <ScanDecodeRow
        fragment={parts.category}
        meaning={"Категория оборудования"}
        detail={decodeEquipmentCategory(parts.category)}
      />
      <ScanDecodeRow
        fragment={parts.serial}
        meaning={"Серийный номер"}
        detail={"присваивается владельцем"}
      />
      <ScanDecodeRow
        fragment={`${parts.checkDigit}`}
        meaning={"Контрольная цифра"}
        detail={"вычисляется по первым 10 знакам"}
      />

      {sizeType && (
        <>
          <ScanSectionTitle title={`Типоразмер ${sizeType.code}`} />
          <ScanDecodeRow
            fragment={sizeType.lengthCode}
            meaning={"Длина"}
            detail={sizeType.length}
          />
          <ScanDecodeRow
            fragment={sizeType.heightCode}
            meaning={"Высота"}
            detail={sizeType.height}
          />
          <ScanDecodeRow
            fragment={sizeType.typeCode}
            meaning={sizeType.typeGroup}
            detail={sizeType.typeDetail}
          />
        </>
      )}

      <ScanSectionTitle title={"Веса и объём"} />
      {maxGrossKg !== null && (
        <ScanResultRow
          label={"MAX GROSS (брутто)"}
          value={formatKg(maxGrossKg)}
        />
      )}
      {tareKg !== null && (
        <ScanResultRow label={"TARE (собственный)"} value={formatKg(tareKg)} />
      )}
      {netKg !== null && (
        <ScanResultRow label={"NET / PAYLOAD (груз)"} value={formatKg(netKg)} />
      )}
      {cubicCapacityM3 !== null && (
        <ScanResultRow
          label={"CU CAP (объём)"}
          value={`${cubicCapacityM3} м³`}
        />
      )}

      <ScanResultRow
        label={"Уверенность OCR"}
        value={`${Math.round(candidate.confidence * 100)}%`}
      />
    </Col>
  );
});

/** 30480 → "30 480 кг" */
function formatKg(value: number): string {
  const rounded = Math.round(value);

  return `${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} кг`;
}
