import React, { FC, memo } from "react";

import { DemoScreen, DemoSection } from "../DemoScreen";
import { AutocompleteDemo } from "./AutocompleteDemo";
import { DateFieldDemo } from "./DateFieldDemo";
import { FormSheetDemo } from "./FormSheetDemo";
import { InlineFormDemo } from "./InlineFormDemo";
import { SelectAsyncDemo } from "./SelectAsyncDemo";
import { SelectCreatableDemo } from "./SelectCreatableDemo";
import { SelectDemo } from "./SelectDemo";
import { SelectDependentDemo } from "./SelectDependentDemo";
import { SelectEagerDemo } from "./SelectEagerDemo";
import { SelectGroupsDemo } from "./SelectGroupsDemo";
import { SelectInfiniteDemo } from "./SelectInfiniteDemo";
import { SelectMultiDemo } from "./SelectMultiDemo";
import { SelectVirtualDemo } from "./SelectVirtualDemo";

export const FormsTab: FC = memo(() => (
  <DemoScreen>
    <DemoSection
      title={"Select"}
      description={
        "Поле открывает шторку со списком: single, clearable, labelInValue, поиск, свой рендер"
      }
    >
      <SelectDemo />
    </DemoSection>

    <DemoSection
      title={"Select multi"}
      description={
        "Теги в поле, maxTagCount, текстом, labelInValue, динамический multi"
      }
    >
      <SelectMultiDemo />
    </DemoSection>

    <DemoSection title={"Группы"} description={"groups и GroupedSelect"}>
      <SelectGroupsDemo />
    </DemoSection>

    <DemoSection
      title={"Creatable"}
      description={"Создание опции из строки поиска (onCreate)"}
    >
      <SelectCreatableDemo />
    </DemoSection>

    <DemoSection
      title={"Autocomplete"}
      description={"Свободный ввод с подсказками в шторке"}
    >
      <AutocompleteDemo />
    </DemoSection>

    <DemoSection
      title={"DateField"}
      description={
        "Поле-триггер TextField: колёса в шторке, «Готово», крестик — сброс в null"
      }
    >
      <DateFieldDemo />
    </DemoSection>

    <DemoSection
      title={"Стратегии опций"}
      description={
        "async, infinite, dependent, eager, controlled — мок-загрузка с задержкой"
      }
    >
      <SelectAsyncDemo />
      <SelectInfiniteDemo />
      <SelectDependentDemo />
      <SelectEagerDemo />
    </DemoSection>

    <DemoSection
      title={"Виртуальный список"}
      description={"virtual: AnchorList в шторке, 1000 вариантов"}
    >
      <SelectVirtualDemo />
    </DemoSection>

    <DemoSection
      title={"Form + useZodForm"}
      description={
        "TextField, Segmented, Select, MultiSelect, Autocomplete, NumberField; zod-схема, тост с результатом"
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
