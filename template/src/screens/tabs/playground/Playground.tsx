import {
  Button,
  Container,
  Content,
  Navbar,
  Row,
  ScrollView,
  Text,
} from "@components";
import { AppScreenProps } from "@core";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";

interface IProps extends AppScreenProps {}

export const Playground: FC<IProps> = observer(({ navigation, route }) => {
  return (
    <Container edges={["top"]}>
      <Navbar>
        <Navbar.Title text={route.name} />
      </Navbar>
      <ScrollView>
        <Content>
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
            title={"Components"}
            onPress={() =>
              navigation.navigate("Components", {
                initialRouteName: "Notifications",
              })
            }
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
