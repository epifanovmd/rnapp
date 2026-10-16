import { IJobStore } from "@entities/job";
import { notifyApiError } from "@shared/lib/http";
import { useNotifications } from "@shared/lib/notifications";
import { Button, Col, Row, Section, SwitchRow, TextField } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC, useCallback, useState } from "react";

/**
 * Запуск демо-задачи `demo.echo` воркеру `echo` агента (право `jobs:demo`):
 * быстрая `echo.quick` или долгая `echo.long` с ходом по шагам и файлом итога.
 */
export const DemoJobLauncher: FC = observer(() => {
  const jobStore = IJobStore.useInstance();
  const notifications = useNotifications();
  const [text, setText] = useState("Привет, агент!");
  const [long, setLong] = useState(true);
  const [withOutput, setWithOutput] = useState(false);
  const [isStarting, setStarting] = useState(false);

  const start = useCallback(async () => {
    setStarting(true);
    const res = await jobStore.startDemoEcho(
      long ? { text, long, ...(withOutput && { withOutput }) } : { text },
    );

    setStarting(false);

    if (res.error) notifyApiError(notifications, res.error);
  }, [jobStore, notifications, text, long, withOutput]);

  return (
    <Section
      title={"Демо-задача"}
      description={"demo.echo — проверка, что агенты на связи."}
      mb={8}
    >
      <Row gap={8} alignItems={"center"}>
        <Col flex={1}>
          <TextField label={"Текст"} value={text} onChangeText={setText} />
        </Col>
        <Button
          size={"small"}
          loading={isStarting}
          disabled={!text.trim()}
          onPress={start}
        >
          {"Запустить"}
        </Button>
      </Row>
      <SwitchRow
        label={"Долгая задача"}
        description={"echo.long: шаги с ходом выполнения"}
        value={long}
        onValueChange={setLong}
      />
      {long && (
        <SwitchRow
          label={"Итог в файл"}
          description={"Ссылка на файл появится в карточке задачи"}
          value={withOutput}
          onValueChange={setWithOutput}
        />
      )}
    </Section>
  );
});
