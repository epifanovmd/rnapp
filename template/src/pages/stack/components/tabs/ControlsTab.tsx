import {
  Checkbox,
  Chip,
  NavLink,
  RadioGroup,
  Row,
  Switch,
  SwitchTheme,
  Text,
} from "@shared/ui";
import React, { FC, memo, useState } from "react";

import { DemoScreen, DemoSection } from "./DemoScreen";

const SIZES = [
  { label: "Маленький", value: "s" },
  { label: "Средний", value: "m", description: "Рекомендуемый" },
  { label: "Большой", value: "l" },
  { label: "Недоступный", value: "xl", disabled: true },
];

export const ControlsTab: FC = memo(() => {
  const [disabled, setDisabled] = useState(false);
  const [checked, setChecked] = useState(true);
  const [circleChecked, setCircleChecked] = useState(false);
  const [size, setSize] = useState("m");
  const [tags, setTags] = useState<string[]>(["react"]);

  const toggleTag = (tag: string) =>
    setTags(current =>
      current.includes(tag)
        ? current.filter(item => item !== tag)
        : [...current, tag],
    );

  return (
    <DemoScreen>
      <DemoSection
        title={"Тема"}
        description={"SwitchTheme — переключатель Light/Dark/System"}
      >
        <SwitchTheme />
      </DemoSection>

      <DemoSection
        title={"Switch"}
        description={"Первый переключатель блокирует остальные контролы"}
      >
        <Row alignItems={"center"} gap={12}>
          <Switch isActive={disabled} onChange={setDisabled} />
          <Text>disabled для контролов ниже</Text>
        </Row>
      </DemoSection>

      <DemoSection title={"Checkbox"} description={"Обычный и circe-вариант"}>
        <Row alignItems={"center"} gap={12}>
          <Checkbox
            isActive={checked}
            onChange={setChecked}
            disabled={disabled}
          />
          <Checkbox
            isActive={circleChecked}
            onChange={setCircleChecked}
            circe
            disabled={disabled}
          />
        </Row>
      </DemoSection>

      <DemoSection
        title={"RadioGroup"}
        description={
          "Типизированный value, label + description, disabled-опции"
        }
      >
        <RadioGroup
          options={SIZES}
          value={size}
          onChange={setSize}
          disabled={disabled}
        />
        <Text color={"textSecondary"} textStyle={"Caption_M3"}>
          Выбрано: {size}
        </Text>
      </DemoSection>

      <DemoSection
        title={"Chip"}
        description={"isActive, левая/правая иконка, мультивыбор"}
      >
        <Row flexWrap={"wrap"} gap={8}>
          {["react", "mobx", "skia", "reanimated"].map(tag => (
            <Chip
              key={tag}
              text={tag}
              isActive={tags.includes(tag)}
              leftIcon={tags.includes(tag) ? "check" : undefined}
              disabled={disabled}
              onPress={() => toggleTag(tag)}
            />
          ))}
          <Chip text={"с иконками"} leftIcon={"search"} rightIcon={"close"} />
        </Row>
      </DemoSection>

      <DemoSection
        title={"NavLink"}
        description={
          "Типизированная навигационная ссылка (to + params из RootParamList)"
        }
      >
        <NavLink to={"Charts"}>
          <Text color={"textLink"}>Открыть Charts →</Text>
        </NavLink>
        <NavLink
          to={"WebView"}
          params={{ title: "React Native", url: "https://reactnative.dev" }}
        >
          <Text color={"textLink"}>WebView с параметрами →</Text>
        </NavLink>
      </DemoSection>
    </DemoScreen>
  );
});
