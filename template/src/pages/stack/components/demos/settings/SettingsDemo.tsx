import { useNotifications } from "@shared/lib/notifications";
import {
  Section,
  SettingsGroup,
  SwitchRow,
  Tag,
  Text,
  ValueRow,
} from "@shared/ui";
import React, { FC, memo, useState } from "react";

import { DemoScreen, DemoSection } from "../DemoScreen";
import { ScreenFallbackDemo } from "./ScreenFallbackDemo";

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const SettingsDemo: FC = memo(() => {
  const toast = useNotifications();
  const [enabled, setEnabled] = useState(true);
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [remote, setRemote] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <DemoScreen>
      <DemoSection
        title={"SettingsGroup + ValueRow / SwitchRow"}
        description={
          "Карточка строк с разделителями; условные строки и фрагменты не дают двойных линий"
        }
      >
        <SettingsGroup>
          <ValueRow
            icon={"briefcase"}
            label={"Проект"}
            value={"Atlas"}
            onPress={() => toast.info("Переход к проекту")}
          />
          <SwitchRow
            icon={"power"}
            label={"Активен"}
            value={enabled}
            onValueChange={setEnabled}
          />
          <ValueRow icon={"globe"} label={"Язык"} value={"Русский"} />
          <ValueRow
            icon={"activity"}
            label={"Статус"}
            value={
              <Tag variant={enabled ? "success" : "muted"} dot>
                {enabled ? "Online" : "Offline"}
              </Tag>
            }
          />
        </SettingsGroup>

        <SettingsGroup>
          <SwitchRow
            icon={"download"}
            label={"Автообновление"}
            description={"Async onValueChange: спиннер в тумблере 1 с"}
            value={autoUpdate}
            onValueChange={async value => {
              await wait(1000);
              setAutoUpdate(value);
            }}
          />
          <SwitchRow
            icon={"sliders"}
            label={"Расширенные"}
            value={showAdvanced}
            onValueChange={setShowAdvanced}
          />
          {showAdvanced && (
            <>
              <SwitchRow
                icon={"terminal"}
                label={"Режим разработчика"}
                value={remote}
                onValueChange={setRemote}
              />
              <ValueRow
                icon={"key"}
                label={"Токены API"}
                description={"3 активных"}
                onPress={() => toast.info("Токены")}
              />
            </>
          )}
          <SwitchRow
            icon={"lock"}
            label={"Disabled"}
            value
            disabled
            onValueChange={() => undefined}
          />
        </SettingsGroup>
      </DemoSection>

      <DemoSection
        title={"Section + Section.Action"}
        description={"Действие справа от заголовка, описание ниже"}
      >
        <Section title={"Проекты"} description={"9 активных, 1 в архиве"}>
          <Section.Action
            title={"Все проекты"}
            onPress={() => toast.info("Все проекты")}
          />
          <Text color={"textSecondary"}>{"Контент секции"}</Text>
        </Section>
        <Section
          title={"Объектный режим"}
          slots={{
            action: { title: "Изменить", onPress: () => toast.info("Изменить") },
          }}
        >
          <Text color={"textSecondary"}>{"slots={{ action: {...} }}"}</Text>
        </Section>
      </DemoSection>

      <DemoSection
        title={"ScreenFallback"}
        description={
          "Заглушка экрана деталей: навбар с «назад» + загрузка / ошибка с повтором / не найдено"
        }
      >
        <ScreenFallbackDemo />
      </DemoSection>
    </DemoScreen>
  );
});
