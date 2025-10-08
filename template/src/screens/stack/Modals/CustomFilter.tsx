import {
  BottomSheet,
  Button,
  Chip,
  Col,
  Row,
  Text,
  useBottomSheetRef,
} from "@components";
import { FilterHolder, FiltersHolder } from "@core/holders";
import { mergeRefs } from "@force-dev/react";
import { observer, useLocalObservable } from "mobx-react-lite";
import React, { forwardRef } from "react";

export interface ICustomFilterProps {}

const filters = {
  first: new FilterHolder({
    title: "Марка",
    options: [
      { text: "BMW", value: "BMW" },
      { text: "Audi", value: "Audi" },
      { text: "Mercedes", value: "Mercedes" },
    ],
    // defaultValue: "BMW",
  }),
  first1: new FilterHolder({
    title: "Марка",
    options: [
      { text: "BMW", value: "BMW" },
      { text: "Audi", value: "Audi" },
      { text: "Mercedes", value: "Mercedes" },
    ],
    defaultValue: "BMW",
  }),
  first2: new FilterHolder({
    title: "Марка",
    options: [
      { text: "BMW", value: "BMW" },
      { text: "Audi", value: "Audi" },
      { text: "Mercedes", value: "Mercedes" },
    ],
  }),
  second: new FilterHolder({
    title: "Год",
    options: new Array(10)
      .fill(0)
      .map((_, i) => ({ text: `201${i}`, value: i })),
    expandable: true,
    expandCount: 5,
    multiple: true,
    defaultValue: [1, 2],
  }),
};

export const CustomFilter = observer(
  forwardRef<BottomSheet, ICustomFilterProps>((props, ref) => {
    const modalRefView = useBottomSheetRef();

    const filter = useLocalObservable(() => new FiltersHolder(filters));

    return (
      <BottomSheet
        onDismiss={() => {
          filter.cancel();
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
                <Text textStyle={"Title_S1"}>{filter.title}</Text>

                <Row alignItems={"center"} gap={8} wrap>
                  {filter.options.map((option, ind) => {
                    return (
                      <Chip
                        key={ind}
                        text={option.text}
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
              console.log("data", JSON.stringify(filter.request));
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
