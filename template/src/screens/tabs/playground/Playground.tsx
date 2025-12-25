import { Button, Container, Content, Row, ScrollView, Text } from "@components";
import { AppScreenProps } from "@core";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";

interface IProps extends AppScreenProps {}

export const Playground: FC<IProps> = observer(({ navigation, route }) => {
  return (
    <Container>
      <ScrollView>
        <Content>
          <Row mb={32}>
            <Text>{route.name}</Text>
          </Row>

          <Button
            mt={8}
            title={"Pdf view"}
            onPress={() =>
              navigation.navigate("PdfView", {
                title: "Pdf view page",
                url: "https://www.princexml.com/samples/catalogue/PrinceCatalogue.pdf",
              })
            }
          />

          <Button
            mt={8}
            title={"Web view"}
            onPress={() =>
              navigation.navigate("WebView", {
                title: "Web view page",
                url: "https://google.com",
              })
            }
          />

          <Button
            mt={8}
            title={"Gallery"}
            onPress={() => navigation.navigate("Gallery")}
          />

          <Button
            mt={8}
            title={"Lottie"}
            onPress={() => navigation.navigate("Lottie")}
          />

          <Button
            mt={8}
            title={"Components"}
            onPress={() =>
              navigation.navigate("Components", {
                initialRouteName: "Notifications",
              })
            }
          />

          <Button
            mt={8}
            title={"ChatScreen"}
            onPress={() => navigation.navigate("ChatScreen")}
          />

          <Button
            mt={8}
            title={"Carousel"}
            onPress={() => navigation.navigate("Carousel")}
          />
        </Content>
      </ScrollView>
    </Container>
  );
});
