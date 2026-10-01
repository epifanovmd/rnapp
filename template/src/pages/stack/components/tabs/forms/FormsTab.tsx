import React, { FC, memo } from "react";

import { DemoScreen, DemoSection } from "../DemoScreen";
import { FormSheetDemo } from "./FormSheetDemo";
import { InlineFormDemo } from "./InlineFormDemo";
import { SelectDemo } from "./SelectDemo";

export const FormsTab: FC = memo(() => (
  <DemoScreen>
    <DemoSection
      title={"Select"}
      description={
        "Поле открывает шторку со списком; поиск — searchable или больше 8 вариантов"
      }
    >
      <SelectDemo />
    </DemoSection>

    <DemoSection
      title={"Form + useZodForm"}
      description={
        "TextField, SegmentedFormField, SelectFormField, NumberFieldFormField; zod-схема, тост с результатом"
      }
    >
      <InlineFormDemo />
    </DemoSection>

    <DemoSection
      title={"ModalSheet"}
      description={
        "Форма в шторке: primaryAction без «Отмены»; Select и ActionSheet открываются поверх (nested)"
      }
    >
      <FormSheetDemo />
    </DemoSection>
  </DemoScreen>
));
