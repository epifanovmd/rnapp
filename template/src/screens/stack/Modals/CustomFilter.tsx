import {
  BottomSheet,
  Button,
  Chip,
  Col,
  Row,
  Text,
  useBottomSheetRef,
} from "@components";
import { FilterHolder, FiltersHolder, IFilterOption } from "@core/holders";
import { mergeRefs } from "@force-dev/react";
import { observer, useLocalObservable } from "mobx-react-lite";
import React, { forwardRef, useEffect } from "react";

export interface ICustomFilterProps {}

const marks = new FilterHolder({
  title: "Марка",
  options: [
    { label: "BMW", value: "BMW" },
    { label: "Audi", value: "AUDI" },
    { label: "Mercedes", value: "MERCEDES" },
  ],
  defaultValue: "BMW",
});

const models = new FilterHolder({
  title: "Модель",
  options: () =>
    new Promise<IFilterOption<string>[]>(resolve => {
      const mark = marks.value;

      setTimeout(() => {
        resolve(
          mark === "BMW"
            ? [
                { label: "BMW 3", value: "3er" },
                { label: "BMW 5", value: "5er" },
                { label: "BMW 7", value: "7er" },
              ]
            : mark === "AUDI"
            ? [
                { label: "A3", value: "A3" },
                { label: "A4", value: "A5" },
                { label: "A6", value: "A6" },
              ]
            : [
                { label: "C класс", value: "C" },
                { label: "E класс", value: "E" },
                { label: "S класс", value: "S" },
              ],
        );
      }, 500);
    }),
});

const filters = {
  marks,
  models,
  user: new FilterHolder({
    title: "Users",
    multiple: true,
    options: new Promise<IFilterOption<number>[]>(resolve => {
      fetch("https://jsonplaceholder.typicode.com/users").then(
        async response => {
          const users = await response.json();

          resolve(
            users.map((user: { name: string; id: number }) => ({
              label: user.name,
              value: user.id,
            })),
          );
        },
      );
    }),
    expandable: true,
    expandCount: 5,
  }),
  years: new FilterHolder({
    title: "Год",
    options: new Array(10)
      .fill(0)
      .map((_, i) => ({ label: `201${i}`, value: `201${i}` })),
    expandable: true,
    expandCount: 5,
    multiple: true,
    defaultValue: ["2010", "2011"],
  }),
  bodyType: new FilterHolder({
    title: "Тип кузова",
    options: [
      { value: "sedan", label: "Седан" },
      { value: "suv", label: "Внедорожник" },
      { value: "hatchback", label: "Хэтчбек" },
      { value: "coupe", label: "Купе" },
      { value: "convertible", label: "Кабриолет" },
      { value: "minivan", label: "Минивэн" },
    ],
    multiple: true,
  }),

  fuelType: new FilterHolder({
    title: "Топливо",
    options: [
      { value: "petrol", label: "Бензин" },
      { value: "diesel", label: "Дизель" },
      { value: "electric", label: "Электро" },
      { value: "hybrid", label: "Гибрид" },
    ],
  }),
};

export const CustomFilter = observer(
  forwardRef<BottomSheet, ICustomFilterProps>((props, ref) => {
    const modalRefView = useBottomSheetRef();

    const filter = useLocalObservable(() => new FiltersHolder(filters));

    useEffect(() => {
      console.log("data", JSON.stringify(filter.request));
    }, [filter.request]);

    return (
      <BottomSheet
        onDismiss={() => {
          filter.cancel();
          filter.cancelExpand();
        }}
        ref={mergeRefs([ref, modalRefView])}
      >
        <BottomSheet.Header
          label={"Фильтр"}
          onClose={() => {
            modalRefView.current?.dismiss();
          }}
        />

        <BottomSheet.Content>
          {filter.filters.map((filter, index) => {
            return (
              <Col key={index} gap={8} mb={16}>
                <Row alignItems={"center"} justifyContent={"space-between"}>
                  <Text textStyle={"Title_S1"}>{filter.title}</Text>
                  {!filter.isEqual && (
                    <Button
                      type={"text"}
                      title={"Сбросить"}
                      onPress={() => filter.reset()}
                    />
                  )}
                </Row>

                <Row alignItems={"center"} gap={8} wrap>
                  {filter.isLoading && <Chip>{"Загрузка..."}</Chip>}
                  {filter.options.map((option, ind) => {
                    return (
                      <Chip
                        key={ind}
                        text={option.label}
                        isActive={option.isActive}
                        onPress={option.onPress}
                      />
                    );
                  })}

                  {filter.expandable && !filter.expanded && (
                    <Button
                      type={"text"}
                      title={"Еще..."}
                      onPress={filter.toggleExpand}
                    />
                  )}
                </Row>
              </Col>
            );
          })}
        </BottomSheet.Content>

        <BottomSheet.Footer>
          <BottomSheet.Footer.PrimaryButton
            onPress={() => {
              filter.apply();
              modalRefView.current?.dismiss();
            }}
            disabled={!filter.isDirty}
            title={"Применить"}
          />
          {!filter.isEqual && (
            <BottomSheet.Footer.SecondaryButton
              title={"Сбросить"}
              onPress={() => {
                filter.reset();
                modalRefView.current?.dismiss();
              }}
            />
          )}
        </BottomSheet.Footer>
      </BottomSheet>
    );
  }),
);
