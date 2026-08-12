import notifee from "@notifee/react-native";
import { useNotifications } from "@shared/lib/notifications";
import { useTheme } from "@shared/lib/theme";
import { useTransition } from "@shared/lib/transition";
import { Button, Col } from "@shared/ui";
import React, { FC, memo } from "react";
import { StyleSheet, Text, View } from "react-native";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const NotificationsTab: FC = memo(() => {
  const notifications = useNotifications();
  const { navbar } = useTransition();
  const { colors } = useTheme();

  const onDisplayNotification = async () => {
    const channelId = await notifee.createChannel({
      id: "default",
      name: "Default Channel",
      vibration: true,
    });

    await notifee.displayNotification({
      title: "Уведомление",
      body: "Нажмите, чтобы открыть ссылку",
      data: {
        url: "rnapp://components?initialRouteName=Modals",
      },
      ios: {
        sound: "default",
        critical: true,
      },
      android: {
        channelId,
        vibrationPattern: [300, 500],
      },
    });
  };

  return (
    <Col ph={16} gap={8} pt={navbar.height}>
      <Button title={"info"} onPress={() => notifications.info("Информация")} />

      <Button
        title={"success + title"}
        onPress={() =>
          notifications.success("Изменения сохранены", { title: "Готово" })
        }
      />

      <Button
        title={"warning (bottom)"}
        onPress={() =>
          notifications.warning("Слабое соединение", { position: "bottom" })
        }
      />

      <Button
        title={"error (6s)"}
        onPress={() => notifications.error("Что-то пошло не так")}
      />

      <Button
        title={"sticky + action"}
        onPress={() =>
          notifications.info("Доступна новая версия приложения", {
            duration: 0,
            action: {
              label: "Обновить",
              onPress: () => notifications.success("Обновление запущено"),
            },
          })
        }
      />

      <Button
        title={"promise (loading → success)"}
        onPress={() =>
          notifications.promise(delay(2000), {
            loading: "Загружаем данные…",
            success: "Данные загружены",
            error: "Не удалось загрузить",
          })
        }
      />

      <Button
        title={"дедупликация (key)"}
        onPress={() =>
          notifications.warning(`Повтор в ${new Date().toLocaleTimeString()}`, {
            key: "dedupe-demo",
            title: "Один тост на key",
          })
        }
      />

      <Button
        title={"очередь (6 подряд)"}
        onPress={() => {
          for (let index = 1; index <= 6; index += 1) {
            notifications.info(`Уведомление №${index} из 6`);
          }
        }}
      />

      <Button
        title={"кастомный рендер"}
        onPress={() =>
          notifications.show("Полностью свой контент", {
            duration: 4000,
            render: notification => (
              <View
                style={[
                  styles.customToast,
                  {
                    backgroundColor: colors.surface,
                    borderLeftColor: colors.success,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.customToastTitle,
                    { color: colors.textPrimary },
                  ]}
                >
                  Кастомный тост
                </Text>
                <Text style={{ color: colors.textSecondary }}>
                  {notification.message}
                </Text>
              </View>
            ),
          })
        }
      />

      <Button title={"скрыть все"} onPress={() => notifications.dismissAll()} />

      <Button title={"Push notification"} onPress={onDisplayNotification} />
    </Col>
  );
});

const styles = StyleSheet.create({
  customToast: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderLeftWidth: 6,
  },
  customToastTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
  },
});
