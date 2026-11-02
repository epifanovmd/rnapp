import { splitByMatches } from "@shared/lib/search";
import React, { FC, useMemo } from "react";

import { ITextProps, Text } from "../text";

export interface IHighlightTextProps extends Omit<ITextProps, "children"> {
  text: string;
  /** Запрос: его слова в тексте подсвечиваются. */
  query: string;
  /** Цвет совпадений. По умолчанию `primary`. */
  highlightColor?: ITextProps["color"];
}

/** Текст с подсвеченными совпадениями запроса (без учёта регистра и «ё»). */
export const HighlightText: FC<IHighlightTextProps> = ({
  text,
  query,
  highlightColor = "primary",
  ...rest
}) => {
  const parts = useMemo(() => splitByMatches(text, query), [text, query]);

  return (
    <Text {...rest}>
      {parts.map((part, index) =>
        part.match ? (
          <Text key={index} color={highlightColor} fontWeight={"600"}>
            {part.text}
          </Text>
        ) : (
          part.text
        ),
      )}
    </Text>
  );
};
