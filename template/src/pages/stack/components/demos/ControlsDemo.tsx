import {
  Checkbox,
  Chip,
  NavLink,
  RadioGroup,
  Row,
  Segmented,
  Switch,
  SwitchTheme,
  Text,
} from "@shared/ui";
import React, { FC, memo, useState } from "react";

import { DemoScreen, DemoSection } from "./DemoScreen";
import { SegmentedPagerDemo } from "./SegmentedPagerDemo";

const SIZES = [
  { label: "Маленький", value: "s" },
  { label: "Средний", value: "m", description: "Рекомендуемый" },
  { label: "Большой", value: "l" },
  { label: "Недоступный", value: "xl", disabled: true },
];

const PERIODS = [
  { label: "День", value: "day" },
  { label: "Неделя", value: "week" },
  { label: "Месяц", value: "month" },
];

const CATEGORIES = [
  "Все",
  "Новости",
  "Спорт",
  "Технологии",
  "Наука",
  "Культура",
  "Путешествия",
  "Еда",
].map(label => ({ label, value: label }));

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const ControlsDemo: FC = memo(() => {
  const [disabled, setDisabled] = useState(false);
  const [asyncOn, setAsyncOn] = useState(false);
  const [checked, setChecked] = useState(true);
  const [circleChecked, setCircleChecked] = useState(false);
  const [size, setSize] = useState("m");
  const [period, setPeriod] = useState("week");
  const [category, setCategory] = useState("Все");
  const [segmentSize, setSegmentSize] = useState("m");
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
        <Row alignItems={"center"} gap={12}>
          <Switch
            isActive={asyncOn}
            disabled={disabled}
            onChange={async value => {
              await delay(1500);
              setAsyncOn(value);
            }}
          />
          <Text>async onChange — спиннер до завершения</Text>
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
        title={"Segmented"}
        description={
          "Индикатор скользит между сегментами, цвет подписи анимирован"
        }
      >
        <Segmented
          options={PERIODS}
          value={period}
          onValueChange={setPeriod}
          disabled={disabled}
        />
        <Segmented
          options={SIZES}
          value={segmentSize}
          onValueChange={setSegmentSize}
          disabled={disabled}
        />
        <Text color={"textSecondary"} textStyle={"Caption_M3"}>
          Последний сегмент — disabled
        </Text>
      </DemoSection>

      <DemoSection
        title={"Segmented scrollable"}
        description={
          "Ширина по контенту, прокрутка и автоцентрирование активного сегмента"
        }
      >
        <Segmented
          scrollable
          options={CATEGORIES}
          value={category}
          onValueChange={setCategory}
          disabled={disabled}
        />
        <Text color={"textSecondary"} textStyle={"Caption_M3"}>
          Выбрано: {category}
        </Text>
      </DemoSection>

      <DemoSection
        title={"SegmentedTabBar"}
        description={"Таб-бар top-tabs: подсветка синхронна с пейджером"}
      >
        <SegmentedPagerDemo />
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
