import { useNavigation, useRoute } from "@shared/lib/navigation";
import { Button, Container, Content, Navbar, ScrollView } from "@shared/ui";
import { useTabBarHeight } from "@widgets/app-shell";
import { observer } from "mobx-react-lite";
import React, { FC } from "react";

export const Playground: FC = observer(() => {
  const navigation = useNavigation();
  const route = useRoute();
  const tabBarHeight = useTabBarHeight();

  return (
    <Container edges={["top"]}>
      <Navbar>
        <Navbar.Title text={route.name} />
      </Navbar>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: tabBarHeight,
        }}
      >
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
            title={"Components"}
            onPress={() =>
              navigation.navigate("Components", {
                initialRouteName: "Carousel",
              })
            }
          />

          <Button
            mt={8}
            title={"Charts"}
            onPress={() => navigation.navigate("Charts")}
          />

          <Button
            mt={8}
            title={"Calendar"}
            onPress={() => navigation.navigate("CalendarDemo")}
          />

          <Button
            mt={8}
            title={"Calendar list"}
            onPress={() => navigation.navigate("CalendarListDemo")}
          />

          <Button
            mt={8}
            title={"Chat"}
            onPress={() => navigation.navigate("Chat")}
          />

          <Button
            mt={8}
            title={"Context menu"}
            onPress={() => navigation.navigate("ContextMenu")}
          />

          <Button
            mt={8}
            title={"Input bar"}
            onPress={() => navigation.navigate("InputBar")}
          />

          <Button
            mt={8}
            title={"Container scanner"}
            onPress={() => navigation.navigate("ContainerScanner")}
          />

          <Button
            mt={8}
            title={"Plate scanner"}
            onPress={() => navigation.navigate("PlateScanner")}
          />

          <Button
            mt={8}
            title={"Text scanner"}
            onPress={() => navigation.navigate("TextScanner")}
          />

          <Button
            mt={8}
            title={"Object scanner"}
            onPress={() => navigation.navigate("ObjectScanner")}
          />
        </Content>
      </ScrollView>
    </Container>
  );
});
