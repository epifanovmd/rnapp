import { BottomSheet, Col, Row, Text, useBottomSheetRef } from "@components";
import { FilterHolder, FiltersHolder } from "@core/holders";
import { mergeRefs } from "@force-dev/react";
import { observer, useLocalObservable } from "mobx-react-lite";
import React, { forwardRef } from "react";
import { TouchableOpacity } from "react-native";

export interface ICustomFilterProps {}

const filters = {
  first: new FilterHolder({
    title: "First filter",
    options: [
      { text: "1", value: { text: "1" } },
      { text: "2", value: { text: "2" } },
    ],
  }),
  second: new FilterHolder({
    title: "Second filter",
    options: new Array(20).fill(0).map((_, i) => ({ text: `${i}`, value: i })),
    expandable: true,
    expandCount: 5,
    multiple: true,
    defaultValue: [4],
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

                <Row gap={8} wrap>
                  {filter.options.map((option, ind) => {
                    return (
                      <TouchableOpacity
                        activeOpacity={1}
                        key={ind}
                        onPress={option.onPress}
                      >
                        <Col
                          radius={16}
                          ph={16}
                          pv={8}
                          bg={option.isActive ? "red" : "pink"}
                        >
                          <Text>{option.text}</Text>
                        </Col>
                      </TouchableOpacity>
                    );
                  })}

                  {filter.expandable && (
                    <TouchableOpacity onPress={filter.toggleExpand}>
                      <Text>{"Еще"}</Text>
                    </TouchableOpacity>
                  )}
                </Row>
              </Col>
            );
          })}
        </BottomSheet.Content>

        <BottomSheet.Footer>
          <BottomSheet.Footer.PrimaryButton
            onPress={() => {
              filter.accept();
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
