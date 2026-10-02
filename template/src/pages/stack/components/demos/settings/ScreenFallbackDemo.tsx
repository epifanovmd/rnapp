import { useNotifications } from "@shared/lib/notifications";
import { Chip, Col, Row, ScreenFallback } from "@shared/ui";
import React, { FC, memo, useState } from "react";

type TFallbackState = "loading" | "error" | "notFound";

const STATES: { key: TFallbackState; label: string }[] = [
  { key: "loading", label: "Загрузка" },
  { key: "error", label: "Ошибка" },
  { key: "notFound", label: "Не найдено" },
];

/** ScreenFallback в рамке: переключение состояний чипами. */
export const ScreenFallbackDemo: FC = memo(() => {
  const toast = useNotifications();
  const [state, setState] = useState<TFallbackState>("loading");

  return (
    <Col gap={12}>
      <Row gap={8} flexWrap={"wrap"}>
        {STATES.map(({ key, label }) => (
          <Chip
            key={key}
            text={label}
            isActive={state === key}
            onPress={() => setState(key)}
          />
        ))}
      </Row>
      <Col
        height={300}
        radius={16}
        overflow={"hidden"}
        borderWidth={1}
        borderColor={"border"}
      >
        <ScreenFallback
          title={"Нода"}
          safeArea={false}
          isLoading={state === "loading"}
          error={state === "error" ? "Сервер не отвечает" : null}
          onRetry={() => setState("loading")}
          notFound={{ title: "Нода не найдена" }}
          onBack={() => toast.info("Назад")}
        />
      </Col>
    </Col>
  );
});
