import { TabProps } from "@shared/lib/navigation";
import { useTransition } from "@shared/lib/transition";
import {
  BottomSheet,
  Button,
  Col,
  Dialog,
  Row,
  ScrollView,
  Text,
  Touchable,
  useBottomSheetRef,
} from "@shared/ui";
import { Icon } from "@shared/ui/icon";
import React, { FC, memo } from "react";

import { CustomFilter } from "./CustomFilter";

export const ModalsTab: FC<TabProps> = memo(({ route }) => {
  const { navbarHeight } = useTransition();

  const filterRef = useBottomSheetRef();
  const modalRefScroll = useBottomSheetRef();
  const modalRefView = useBottomSheetRef();

  const [isVisible, setVisible] = React.useState(false);

  return (
    <Col ph={16} gap={8} pt={navbarHeight}>
      <Button
        title={"Open filter"}
        onPress={() => filterRef.current?.present()}
      />
      <Button
        title={"View bottom sheet with snap point"}
        onPress={() => modalRefScroll.current?.present()}
      />
      <Button
        title={"View bottom sheet"}
        onPress={() => {
          modalRefView.current?.present();
        }}
      />

      <Button
        title={"View dialog"}
        onPress={() => {
          setVisible(true);
        }}
      />

      <CustomFilter ref={filterRef} />

      <Dialog
        isVisible={isVisible}
        onClose={() => setVisible(false)}
        enableBackdropClose={false}
        enableSwipeClose={true}
      >
        <Row
          alignItems={"center"}
          gap={8}
          justifyContent={"space-between"}
          pb={16}
        >
          <Text textStyle={"Title_L"}>{"Заголовок"}</Text>
          <Touchable onPress={() => setVisible(false)}>
            <Icon name={"closeCircle"} />
          </Touchable>
        </Row>
        <ScrollView>
          {new Array(20).fill(0).map((_, i) => (
            <Row key={i}>
              <Text>{`Item B - ${i + 1}`}</Text>
            </Row>
          ))}
        </ScrollView>
        <Button
          mt={8}
          title={"Close modal"}
          onPress={() => {
            setVisible(false);
          }}
        />
      </Dialog>

      <BottomSheet
        ref={modalRefScroll}
        snapPoints={[300, 500]}
        maxDynamicContentSize={500}
      >
        <BottomSheet.Header
          label={"Заголовок"}
          onClose={() => {
            modalRefScroll.current?.dismiss();
          }}
        />
        <BottomSheet.Content>
          {new Array(90).fill(0).map((_, i) => (
            <Row key={i}>
              <Text>{`Item B - ${i + 1}`}</Text>
            </Row>
          ))}
        </BottomSheet.Content>

        <BottomSheet.Footer>
          <BottomSheet.Footer.PrimaryButton title={"Готово"} />
          <BottomSheet.Footer.SecondaryButton
            title={"Отмена"}
            onPress={() => {
              modalRefScroll.current?.dismiss();
            }}
          />
        </BottomSheet.Footer>
      </BottomSheet>

      <BottomSheet ref={modalRefView} maxDynamicContentSize={300}>
        <BottomSheet.Header
          label={"Заголовок"}
          onClose={() => {
            modalRefView.current?.dismiss();
          }}
        />
        <BottomSheet.Content>
          <Text>{"Контент"}</Text>
          {new Array(50).fill(0).map((_, i) => (
            <Row key={i}>
              <Text>{`Item B - ${i + 1}`}</Text>
            </Row>
          ))}
        </BottomSheet.Content>
        <BottomSheet.Footer>
          <BottomSheet.Footer.PrimaryButton title={"Готово"} />
          <BottomSheet.Footer.SecondaryButton
            title={"Отмена"}
            onPress={() => {
              modalRefView.current?.dismiss();
            }}
          />
        </BottomSheet.Footer>
      </BottomSheet>
    </Col>
  );
});
