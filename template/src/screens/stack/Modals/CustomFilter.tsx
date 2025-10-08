import { BottomSheet, Col, Row, Text, useBottomSheetRef } from "@components";
import { FilterHolder, FiltersHolder } from "@core/holders";
import { mergeRefs } from "@force-dev/react";
import { observer, useLocalObservable } from "mobx-react-lite";
import React, { forwardRef, memo, useEffect, useRef } from "react";
import { TouchableOpacity } from "react-native";

export interface ICustomFilterProps {}

export const CustomFilter = observer(
  forwardRef<BottomSheet, ICustomFilterProps>((props, ref) => {
    const modalRefView = useBottomSheetRef();

    const filter = useLocalObservable(
      () =>
        new FiltersHolder({
          first: new FilterHolder({
            title: "First filter",
            options: [
              { text: "1", value: 1 },
              { text: "2", value: 2 },
            ],
          }),
          second: new FilterHolder({
            title: "Second filter",
            options: new Array(20)
              .fill(0)
              .map((_, i) => ({ text: `${i}`, value: i })),
            expandable: true,
            expandCount: 5,
            multiple: true,
            value: [4],
          }),
        }),
    );

    console.log("filter.filters", filter.filters);

    return (
      <BottomSheet
        // snapPoints={[300]}
        // snapPoints={["30%", "50%"]}
        // enableDynamicSizing={false}
        onDismiss={() => {
          filter.reset();
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
          {/* {new Array(30).fill(0).map((_, i) => (*/}
          {/*  <Row key={i}>*/}
          {/*    <Text>{`Item B - ${i + 1}`}</Text>*/}
          {/*  </Row>*/}
          {/* ))}*/}

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
                        onPress={() => filter.setValue(option.value)}
                      >
                        <Col
                          radius={16}
                          ph={16}
                          pv={8}
                          bg={filter.checkActive(option.value) ? "red" : "pink"}
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

        <BottomSheet.Footer
          onPrimary={() => {
            console.log("onAccept");
          }}
          onSecondary={() => {
            modalRefView.current?.dismiss();
          }}
        >
          <BottomSheet.Footer.PrimaryButton title={"Готово"} />
          <BottomSheet.Footer.SecondaryButton title={"Отмена"} />
        </BottomSheet.Footer>
      </BottomSheet>
    );
  }),
);
