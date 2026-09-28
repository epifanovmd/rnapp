import { Row, Text, TextStyle, TTextStyle } from "@shared/ui";
import React, { FC, memo } from "react";

import { DemoScreen, DemoSection } from "./DemoScreen";

const TEXT_STYLES = Object.keys(TextStyle) as (keyof TTextStyle)[];

export const TypographyTab: FC = memo(() => {
  return (
    <DemoScreen>
      <DemoSection
        title={"Текстовые стили"}
        description={"Все варианты textStyle компонента Text"}
      >
        {TEXT_STYLES.map(styleName => (
          <Row key={styleName} alignItems={"baseline"} gap={12}>
            <Text textStyle={styleName} flexShrink={1}>
              {styleName}
            </Text>
            <Text color={"textTertiary"} textStyle={"Caption_M3"}>
              {`${TextStyle[styleName].fontSize}/${TextStyle[styleName].lineHeight}`}
            </Text>
          </Row>
        ))}
      </DemoSection>

      <DemoSection
        title={"Цвета текста"}
        description={"Проп color — ключ темы"}
      >
        <Text color={"textPrimary"}>textPrimary — основной текст</Text>
        <Text color={"textSecondary"}>textSecondary — второстепенный</Text>
        <Text color={"textTertiary"}>textTertiary — вспомогательный</Text>
        <Text color={"textLink"}>textLink — ссылки</Text>
        <Text color={"danger"}>danger — ошибки</Text>
        <Text color={"success"}>success — успех</Text>
      </DemoSection>

      <DemoSection
        title={"Text: возможности"}
        description={"FlexProps, text-проп, numberOfLines"}
      >
        <Text text={"Через проп text"} />
        <Text numberOfLines={1} ellipsizeMode={"tail"}>
          numberOfLines={"{1}"}: очень длинный текст, который не помещается в
          одну строку и обрезается многоточием в конце строки
        </Text>
        <Text textAlign={"center"} bg={"rgba(127,127,127,0.15)"} pv={4}>
          textAlign=center + фон и отступы через FlexProps
        </Text>
      </DemoSection>
    </DemoScreen>
  );
});
