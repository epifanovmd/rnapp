import { Col, Segmented, SwitchRow, Text } from "@shared/ui";
import React, { FC, memo } from "react";

import type { ITabBarDemoOptions } from "./tab-bar-demo-options";

interface ITabBarDemoSettingsProps {
  options: ITabBarDemoOptions;
  onChange: (options: ITabBarDemoOptions) => void;
}

/** Переключатели вида таб-бара. */
export const TabBarDemoSettings: FC<ITabBarDemoSettingsProps> = memo(
  ({ options, onChange }) => {
    const set = <K extends keyof ITabBarDemoOptions>(
      key: K,
      value: ITabBarDemoOptions[K],
    ) => onChange({ ...options, [key]: value });

    return (
      <Col gap={10}>
        <Text textStyle={"Caption_M3"} color={"textSecondary"}>
          {"Вид"}
        </Text>
        <Segmented
          options={[
            { value: "floating", label: "Плавающий" },
            { value: "docked", label: "Прикреплённый" },
          ]}
          value={options.variant}
          onValueChange={value => set("variant", value)}
        />
        <Text textStyle={"Caption_M3"} color={"textSecondary"}>
          {"Подписи"}
        </Text>
        <Segmented
          options={[
            { value: "always", label: "Все" },
            { value: "active", label: "Активная" },
            { value: "never", label: "Нет" },
          ]}
          value={options.labels}
          onValueChange={value => set("labels", value)}
        />
        <Text textStyle={"Caption_M3"} color={"textSecondary"}>
          {"Отметка выбора"}
        </Text>
        <Segmented
          options={[
            { value: "pill", label: "Пилюля" },
            { value: "dot", label: "Точка" },
            { value: "line", label: "Линия" },
            { value: "none", label: "Нет" },
          ]}
          value={options.indicator}
          onValueChange={value => set("indicator", value)}
        />
        <Segmented
          options={[
            { value: "worm", label: "Червяк" },
            { value: "slide", label: "Сдвиг" },
          ]}
          value={options.indicatorAnimation}
          onValueChange={value => set("indicatorAnimation", value)}
        />
        <Text textStyle={"Caption_M3"} color={"textSecondary"}>
          {"Фон и ширина"}
        </Text>
        <Segmented
          options={[
            { value: "blur", label: "Размытие" },
            { value: "solid", label: "Сплошной" },
          ]}
          value={options.surface}
          onValueChange={value => set("surface", value)}
        />
        <Segmented
          options={[
            { value: "auto", label: "Авто" },
            { value: "fill", label: "По экрану" },
            { value: "hug", label: "По вкладкам" },
          ]}
          value={options.fit}
          onValueChange={value => set("fit", value)}
        />
        <SwitchRow
          label={"Пружинка иконки"}
          value={options.bounce}
          onValueChange={value => set("bounce", value)}
        />
        <SwitchRow
          label={"Вибрация"}
          value={options.haptics}
          onValueChange={value => set("haptics", value)}
        />
        <SwitchRow
          label={"Бейджи"}
          value={options.badges}
          onValueChange={value => set("badges", value)}
        />
      </Col>
    );
  },
);
