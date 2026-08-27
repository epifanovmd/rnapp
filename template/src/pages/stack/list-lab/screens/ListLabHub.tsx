import {
  Button,
  Container,
  Content,
  Navbar,
  ScrollView,
  Text,
} from "@shared/ui";
import React, { FC } from "react";

import type { ListLabScreenName, ListLabScreenProps } from "../list-lab.types";

interface ILabEntry {
  screen: Exclude<ListLabScreenName, "Hub">;
  title: string;
  description: string;
}

const ENTRIES: ILabEntry[] = [
  {
    screen: "InitialPosition",
    title: "Стартовая позиция",
    description:
      "Позиция пишется в MMKV и восстанавливается при возврате на экран",
  },
  {
    screen: "Pagination",
    title: "Подгрузка сверху и снизу",
    description:
      "Спиннеры на обеих кромках, удержание позиции отключается тумблером",
  },
  {
    screen: "Mvcp",
    title: "Компенсация позиции",
    description: "Вставка, удаление и рост строк выше вьюпорта по кнопке",
  },
  {
    screen: "InputBarInset",
    title: "Нижний отступ",
    description: "Панель ввода и клавиатура: контент не должен уходить под них",
  },
  {
    screen: "Sticky",
    title: "Прилипание",
    description: "Даты у верхней кромки, аватарки у нижней",
  },
  {
    screen: "Perf",
    title: "Производительность",
    description: "Тысяча сообщений и подгрузка в обе стороны, без настроек",
  },
  {
    screen: "PerfLegend",
    title: "Производительность · legend",
    description: "Тот же список и та же подгрузка на @legendapp/list",
  },
];

/** Список стендов списка. */
export const ListLabHub: FC<ListLabScreenProps<"Hub">> = ({ navigation }) => (
  <Container>
    <Navbar title={"Стенды списка"} safeArea>
      <Navbar.BackButton />
    </Navbar>

    <ScrollView>
      <Content>
        {ENTRIES.map(entry => (
          <React.Fragment key={entry.screen}>
            <Button
              mt={12}
              title={entry.title}
              onPress={() => navigation.navigate(entry.screen)}
            />
            <Text textStyle={"Caption_M2"} color={"textSecondary"} mt={4}>
              {entry.description}
            </Text>
          </React.Fragment>
        ))}
      </Content>
    </ScrollView>
  </Container>
);

ListLabHub.displayName = "ListLabHub";
