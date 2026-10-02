import { useNotifications } from "@shared/lib/notifications";
import { useTheme } from "@shared/lib/theme";
import {
  Avatar,
  Button,
  Col,
  CopyableText,
  DisclosureRow,
  EmptyState,
  Icon,
  IconButton,
  InfoRow,
  ListItem,
  Notice,
  QrCode,
  Row,
  StatCard,
  Tag,
  Text,
  TTagVariant,
} from "@shared/ui";
import React, { FC, memo } from "react";

import { DemoScreen, DemoSection } from "../DemoScreen";
import { ConfirmDemo } from "./ConfirmDemo";
import { ScreenStateDemo } from "./ScreenStateDemo";

const TAG_VARIANTS: TTagVariant[] = [
  "default",
  "primary",
  "secondary",
  "destructive",
  "purple",
  "success",
  "warning",
  "info",
  "outline",
  "muted",
];

const API_TOKEN = "demo_7Qm3xv2Lk9aP0dR5tY8uW1zC4bH6jF2gS7kV0o";
const QR_VALUE = "https://reactnative.dev";

export const DataDemo: FC = memo(() => {
  const toast = useNotifications();
  const { colors } = useTheme();

  return (
    <DemoScreen>
      <DemoSection
        title={"Tag"}
        description={"Все варианты; dot — точка-индикатор, icon — иконка"}
      >
        <Row flexWrap={"wrap"} gap={8}>
          {TAG_VARIANTS.map(variant => (
            <Tag key={variant} variant={variant}>
              {variant}
            </Tag>
          ))}
        </Row>
        <Row flexWrap={"wrap"} gap={8}>
          <Tag variant={"success"} dot>
            {"Online"}
          </Tag>
          <Tag variant={"destructive"} dot>
            {"Offline"}
          </Tag>
          <Tag variant={"warning"} dot>
            {"На проверке"}
          </Tag>
          <Tag
            variant={"info"}
            icon={<Icon name={"shield"} size={12} color={colors.info} />}
          >
            {"Приватный"}
          </Tag>
          <Tag
            variant={"outline"}
            icon={<Icon name={"globe"} size={12} color={colors.textPrimary} />}
          >
            {"Публичный"}
          </Tag>
        </Row>
      </DemoSection>

      <DemoSection
        title={"DisclosureRow"}
        description={
          "Обёртка-переход: любое содержимое, стрелка справа, нажатие на всю строку"
        }
      >
        <DisclosureRow
          bg={"surface"}
          radius={16}
          pa={14}
          onPress={() => toast.info("Нажата строка")}
        >
          <Text textStyle={"Title_S2"}>{"Мобильное приложение"}</Text>
          <Text textStyle={"Caption_M3"} color={"textSecondary"}>
            {"24 задачи · 5 участников"}
          </Text>
        </DisclosureRow>
        <DisclosureRow bg={"surface"} radius={16} pa={14}>
          <Text>{"Без onPress — без стрелки"}</Text>
        </DisclosureRow>
      </DemoSection>

      <DemoSection
        title={"ListItem"}
        description={
          "icon/leading слева, trailing справа, footer снизу; шеврон — при onPress"
        }
      >
        <ListItem
          title={"Проект Atlas"}
          subtitle={"12 задач · обновлён вчера"}
          icon={"briefcase"}
          trailing={
            <Tag variant={"success"} dot>
              {"Online"}
            </Tag>
          }
          onPress={() => toast.info("Открыт Atlas")}
        />
        <ListItem
          title={"Иван Петров"}
          subtitle={"ivan@example.com"}
          leading={<Avatar name={"Иван Петров"} size={36} online />}
          trailing={
            <IconButton
              name={"moreVertical"}
              accessibilityLabel={"Действия"}
              color={"textSecondary"}
              onPress={() => toast.info("Меню пользователя")}
            />
          }
        />
        <ListItem
          title={"Релиз 2.4"}
          subtitle={"Сроки под угрозой"}
          icon={"activity"}
          footer={
            <Row gap={6} flexWrap={"wrap"}>
              <Tag variant={"warning"}>{"Просрочено 3"}</Tag>
              <Tag variant={"muted"}>{"Высокий приоритет"}</Tag>
              <Tag variant={"info"}>{"12 задач"}</Tag>
            </Row>
          }
          onPress={() => toast.info("Открыт релиз 2.4")}
        />
      </DemoSection>

      <DemoSection
        title={"InfoRow"}
        description={
          "Подпись — значение; copyValue копирует по нажатию, mono — моноширинный"
        }
      >
        <Col bg={"surface"} radius={16} ph={14} pv={8} gap={4}>
          <InfoRow label={"Проект"} value={"Atlas"} />
          <InfoRow
            label={"Почта"}
            value={"team@example.com"}
            copyValue={"team@example.com"}
          />
          <InfoRow
            label={"Токен API"}
            value={`${API_TOKEN.slice(0, 12)}…`}
            copyValue={API_TOKEN}
            mono
          />
          <InfoRow label={"Задач"} value={42} />
          <InfoRow label={"Комментарий"} />
          <InfoRow
            label={"Статус"}
            value={
              <Tag variant={"success"} dot>
                {"Online"}
              </Tag>
            }
          />
        </Col>
      </DemoSection>

      <DemoSection
        title={"CopyableText"}
        description={"Нажатие копирует text, иконка → галочка, тост"}
      >
        <CopyableText text={"ivan@example.com"} />
        <CopyableText text={API_TOKEN} mono copiedLabel={"Токен скопирован"} />
        <CopyableText text={"Без тоста"} copiedLabel={null} />
      </DemoSection>

      <DemoSection title={"StatCard"} description={"Сетка в 2 колонки"}>
        <Row gap={12}>
          <StatCard
            label={"Участники"}
            value={128}
            hint={"+12 за неделю"}
            icon={"users"}
          />
          <StatCard
            label={"Задачи закрыты"}
            value={342}
            hint={"за месяц"}
            icon={"activity"}
            tone={"success"}
          />
        </Row>
        <Row gap={12}>
          <StatCard
            label={"Просрочено"}
            value={3}
            hint={"за неделю"}
            icon={"circleAlert"}
            tone={"danger"}
          />
          <StatCard
            label={"В срок"}
            value={"94%"}
            icon={"clock"}
            tone={"warning"}
          />
        </Row>
      </DemoSection>

      <DemoSection title={"Notice"} description={"4 варианта, с action"}>
        <Notice
          title={"Информация"}
          description={"Обновление будет установлено ночью"}
        />
        <Notice variant={"success"} description={"Изменения сохранены"} />
        <Notice
          variant={"warning"}
          title={"Подписка истекает"}
          description={"Осталось 5 дней"}
          action={
            <Button
              size={"small"}
              appearance={"outline"}
              title={"Продлить"}
              onPress={() => toast.success("Подписка продлена")}
            />
          }
        />
        <Notice
          variant={"danger"}
          title={"Синхронизация не удалась"}
          description={"Нет связи 3 минуты"}
          action={
            <Button
              size={"small"}
              variant={"danger"}
              title={"Повторить"}
              onPress={() => toast.info("Повтор…")}
            />
          }
        />
      </DemoSection>

      <DemoSection title={"EmptyState"} description={"Иконка, текст, действие"}>
        <Col bg={"surface"} radius={16}>
          <EmptyState
            icon={"users"}
            title={"Пользователей нет"}
            description={"Пригласите коллег, чтобы работать вместе"}
            action={
              <Button
                size={"small"}
                leftIcon={"userPlus"}
                title={"Пригласить"}
                onPress={() => toast.success("Приглашение отправлено")}
              />
            }
          />
        </Col>
      </DemoSection>

      <DemoSection
        title={"ScreenState"}
        description={"Загрузка → ошибка (с повтором) → пусто → контент"}
      >
        <ScreenStateDemo />
      </DemoSection>

      <DemoSection
        title={"QrCode"}
        description={"SVG, чёрный на белом в любой теме"}
      >
        <Row gap={16} alignItems={"center"}>
          <QrCode value={QR_VALUE} size={160} />
          <Col flex={1} gap={4}>
            <Text textStyle={"Caption_M3"} color={"textSecondary"}>
              {"Значение"}
            </Text>
            <CopyableText text={QR_VALUE} numberOfLines={2} />
          </Col>
        </Row>
      </DemoSection>

      <DemoSection
        title={"IconButton"}
        description={"Иконка без подписи: color — токен или цвет, disabled"}
      >
        <Row gap={24} alignItems={"center"}>
          <IconButton
            name={"edit"}
            accessibilityLabel={"Редактировать"}
            onPress={() => toast.info("Редактировать")}
          />
          <IconButton
            name={"share"}
            accessibilityLabel={"Поделиться"}
            color={"primary"}
            onPress={() => toast.info("Поделиться")}
          />
          <IconButton
            name={"trash"}
            accessibilityLabel={"Удалить"}
            color={"danger"}
            size={26}
            onPress={() => toast.error("Удалить")}
          />
          <IconButton
            name={"settings"}
            accessibilityLabel={"Настройки"}
            color={"#8B5CF6"}
            onPress={() => toast.info("Настройки")}
          />
          <IconButton
            name={"lock"}
            accessibilityLabel={"Недоступно"}
            disabled
          />
        </Row>
      </DemoSection>

      <DemoSection
        title={"useConfirm"}
        description={"Системный Alert; промис — true при согласии"}
      >
        <ConfirmDemo />
      </DemoSection>
    </DemoScreen>
  );
});
