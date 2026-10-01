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

export const SettingsTab: FC = memo(() => {
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
            icon={"server"}
            label={"Нода"}
            value={"nl-ams-01"}
            onPress={() => toast.info("Переход к ноде")}
          />
          <SwitchRow
            icon={"power"}
            label={"Включён"}
            value={enabled}
            onValueChange={setEnabled}
          />
          <ValueRow icon={"globe"} label={"Регион"} value={"eu-west"} />
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
                label={"Удалённый доступ"}
                value={remote}
                onValueChange={setRemote}
              />
              <ValueRow
                icon={"key"}
                label={"Ключи доступа"}
                description={"3 активных"}
                onPress={() => toast.info("Ключи")}
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
        <Section title={"Ноды"} description={"9 онлайн, 1 офлайн"}>
          <Section.Action
            title={"Все ноды"}
            onPress={() => toast.info("Все ноды")}
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
