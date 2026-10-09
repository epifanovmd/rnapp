import type { AgentDto } from "@shared/api/gen/main/model";
import {
  Button,
  Chip,
  Col,
  Notice,
  Row,
  Section,
  Segmented,
  type SegmentedOption,
  Tag,
  Text,
  TextField,
} from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";
import { Platform, ScrollView, StyleSheet } from "react-native";

import { FETCH_METHODS, type TFetchMethod } from "../lib/fetch-result";
import { useWorkerFetchVM } from "../model/useWorkerFetchVM";

interface IWorkerFetchConsoleProps {
  agent: AgentDto;
}

const METHOD_OPTIONS: SegmentedOption<TFetchMethod>[] = FETCH_METHODS.map(
  method => ({ value: method, label: method }),
);

/** Запрос к воркеру: маршрут из манифеста или свой путь, JSON-тело, ответ. */
export const WorkerFetchConsole: FC<IWorkerFetchConsoleProps> = observer(
  ({ agent }) => {
    const vm = useWorkerFetchVM(agent);
    const online = agent.online && !agent.revoked;

    if (vm.workers.length === 0) {
      return (
        <Notice
          variant={"info"}
          description={"Воркеров нет — запросы отправлять некому"}
        />
      );
    }

    return (
      <Section
        title={"Запрос к воркеру"}
        description={"Агент передаст его воркеру; служебные пути недоступны"}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {vm.workers.map(name => (
            <Chip
              key={name}
              text={name}
              isActive={name === vm.worker}
              onPress={() => vm.setWorker(name)}
            />
          ))}
        </ScrollView>
        {vm.routes.length > 0 && (
          <Col gap={6}>
            <Text textStyle={"Caption_M2"} color={"textSecondary"}>
              {"Маршруты из манифеста"}
            </Text>
            {vm.routes.map(route => (
              <Button
                key={`${route.method} ${route.path}`}
                title={`${route.method.toUpperCase()} ${route.path}`}
                appearance={"ghost"}
                size={"small"}
                alignSelf={"flex-start"}
                onPress={() => vm.pickRoute(route)}
              />
            ))}
          </Col>
        )}
        <Segmented
          options={METHOD_OPTIONS}
          value={vm.method}
          onValueChange={vm.setMethod}
          scrollable
        />
        <TextField
          label={"Путь"}
          value={vm.path}
          onChangeText={vm.setPath}
          autoCapitalize={"none"}
          autoCorrect={false}
        />
        {vm.hasBody && (
          <TextField
            label={"Тело (JSON)"}
            value={vm.body}
            onChangeText={vm.setBody}
            multiline
            numberOfLines={8}
            autoCapitalize={"none"}
            autoCorrect={false}
          />
        )}
        <Button
          title={"Отправить"}
          leftIcon={"play"}
          size={"small"}
          loading={vm.isSending}
          disabled={!online}
          onPress={vm.send}
        />
        {!online && (
          <Text textStyle={"Caption_M3"} color={"textSecondary"}>
            {"Агент без связи: запрос не дойдёт до воркера"}
          </Text>
        )}
        {!!vm.result && (
          <Col gap={8}>
            <Row wrap alignItems={"center"} gap={6}>
              <Tag variant={vm.result.ok ? "success" : "destructive"}>
                {vm.result.status === null
                  ? "успешно"
                  : `статус ${vm.result.status}`}
              </Tag>
              <Text textStyle={"Caption_M3"} color={"textSecondary"}>
                {vm.result.fromWorker ? "ответ воркера" : "ошибка сервера"}
              </Text>
            </Row>
            <Col bg={"onSurface"} radius={12} pa={12}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text textStyle={"Caption_M3"} style={styles.mono} selectable>
                  {vm.result.body || "Пустое тело"}
                </Text>
              </ScrollView>
            </Col>
          </Col>
        )}
      </Section>
    );
  },
);

const styles = StyleSheet.create({
  chips: { gap: 8 },
  mono: {
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
  },
});
