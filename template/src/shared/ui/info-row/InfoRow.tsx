import React, { FC, memo, ReactNode } from "react";

import { CopyableText } from "../copyable-text";
import { FlexProps, Row } from "../flex-view";
import { Text } from "../text";

export interface IInfoRowProps extends FlexProps {
  label: string;
  /** Значение; строка рендерится текстом, иначе — как есть. */
  value?: ReactNode;
  /** Копирование значения по нажатию. */
  copyValue?: string;
  mono?: boolean;
  /** Заглушка пустого значения. */
  placeholder?: string;
}

/** Строка «подпись — значение» карточки сведений. */
export const InfoRow: FC<IInfoRowProps> = memo(
  ({ label, value, copyValue, mono, placeholder = "—", ...rest }) => {
    const empty = value === undefined || value === null || value === "";

    const isNode = !empty && typeof value !== "string";

    const content = copyValue ? (
      isNode ? (
        <Row alignItems={"center"} gap={6} flexShrink={1}>
          {value}
          <CopyableText text={copyValue} displayText={""} />
        </Row>
      ) : (
        <CopyableText
          text={copyValue}
          displayText={typeof value === "string" ? value : undefined}
          mono={mono}
        />
      )
    ) : empty ? (
      <Text color={"textTertiary"}>{placeholder}</Text>
    ) : typeof value === "string" || typeof value === "number" ? (
      <Text textAlign={"right"} flexShrink={1} numberOfLines={2}>
        {value}
      </Text>
    ) : (
      value
    );

    return (
      <Row
        alignItems={"center"}
        justifyContent={"space-between"}
        gap={12}
        minHeight={28}
        {...rest}
      >
        <Text textStyle={"Body_S2"} color={"textSecondary"} flexShrink={0}>
          {label}
        </Text>
        <Row flexShrink={1} justifyContent={"flex-end"}>
          {content}
        </Row>
      </Row>
    );
  },
);
