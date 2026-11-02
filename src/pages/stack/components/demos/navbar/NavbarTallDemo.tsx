import {
  Col,
  NavbarProvider,
  Notice,
  Segmented,
  type SegmentedOption,
  Text,
} from "@shared/ui";
import React, { FC, memo, useState } from "react";

import { NAVBAR_DEMO_ROWS, NAVBAR_DEMO_SHORT_ROWS } from "./navbar-demo-data";
import { NavbarHiddenContent } from "./NavbarHiddenContent";

type TContentLength = "long" | "short";

const LENGTH_OPTIONS: SegmentedOption<TContentLength>[] = [
  { value: "long", label: "Длинный" },
  { value: "short", label: "Короткий" },
];

/**
 * Высокая шапка: навбар, карточка и закреплённая полоса. Пока контент
 * прокручен меньше хода скрытия, шапка едет вместе с ним в обе стороны;
 * за порогом — прячется и показывается по направлению жеста. Короткий
 * список — край, когда контент едва длиннее экрана.
 */
export const NavbarTallDemo: FC = memo(() => {
  const [length, setLength] = useState<TContentLength>("long");

  return (
    <NavbarProvider>
      <NavbarHiddenContent
        title={"Tall header"}
        header={
          <Col ph={16} pb={12}>
            <Col bg={"surface"} radius={16} pa={16} gap={8} height={220}>
              <Text textStyle={"Title_L"}>{"Карточка в шапке"}</Text>
              <Text textStyle={"Body_M1"} color={"textSecondary"}>
                {"Уезжает вместе с навбаром; полоса ниже закреплена."}
              </Text>
            </Col>
          </Col>
        }
        sticky={
          <Col ph={16} pb={8}>
            <Segmented<TContentLength>
              options={LENGTH_OPTIONS}
              value={length}
              onValueChange={setLength}
            />
          </Col>
        }
        top={
          <Notice
            title={"Порог скрытия"}
            description={
              "Проскролльте чуть-чуть и обратно — шапка едет с контентом. Длинный скролл — прячется по направлению жеста."
            }
          />
        }
        rows={length === "long" ? NAVBAR_DEMO_ROWS : NAVBAR_DEMO_SHORT_ROWS}
      />
    </NavbarProvider>
  );
});
