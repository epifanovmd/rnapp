import { ISessionStore, SessionModel } from "@entities/user";
import { IAuthSessionGuard } from "@shared/lib/contracts";
import { notifyApiError } from "@shared/lib/http";
import { useNotifications } from "@shared/lib/notifications";
import { Button, Col, Row, Section, Spinner, Text } from "@shared/ui";
import { observer } from "mobx-react-lite";
import React, { FC, useEffect } from "react";

/** Активные сессии пользователя с завершением по одной и всех остальных. */
export const SessionsSection: FC = observer(() => {
  const sessionStore = ISessionStore.useInstance();
  const sessionGuard = IAuthSessionGuard.useInstance();
  const notifications = useNotifications();
  const holder = sessionStore.sessionsHolder;

  useEffect(() => {
    sessionStore.load();
  }, [sessionStore]);

  return (
    <Section title={"Сессии"} description={"Устройства, где выполнен вход."}>
      {sessionStore.isLoading && <Spinner size={24} />}
      {holder.isError && !sessionStore.sessions.length && (
        <Row gap={8} alignItems={"center"}>
          <Text textStyle={"Caption_M1"} color={"danger"} flex={1}>
            {holder.error?.message ?? "Не удалось загрузить сессии"}
          </Text>
          <Button
            size={"small"}
            appearance={"ghost"}
            onPress={() => sessionStore.load()}
          >
            {"Повторить"}
          </Button>
        </Row>
      )}

      {sessionStore.sessions.map(session => {
        const model = new SessionModel(session);
        const current = sessionGuard.isCurrentSession(session.id);

        return (
          <Row key={session.id} gap={8} alignItems={"center"}>
            <Col flex={1}>
              <Text textStyle={"Body_M1"}>{model.deviceName}</Text>
              {current && (
                <Text textStyle={"Caption_M1"} color={"success"}>
                  {"Это устройство"}
                </Text>
              )}
              <Text textStyle={"Caption_M1"} color={"textSecondary"}>
                {[session.ip, model.lastActiveAtDate.formatted]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </Col>
            {!current && (
              <Button
                size={"small"}
                variant={"danger"}
                appearance={"ghost"}
                disabled={sessionStore.terminateMutation.isLoading}
                onPress={() => sessionStore.terminateSession(session.id)}
              >
                {"Завершить"}
              </Button>
            )}
          </Row>
        );
      })}

      <Button
        size={"small"}
        appearance={"outline"}
        onPress={async () => {
          const res = await sessionStore.terminateOtherSessions();

          notifyApiError(notifications, res.error);
        }}
      >
        {"Завершить остальные сессии"}
      </Button>
    </Section>
  );
});
