import { Col, Segmented, SwitchRow, Text } from "@shared/ui";
import React, { FC, memo } from "react";

import type {
  ISearchHiddenBarOptions,
  TSearchOverlayMode,
} from "./search-demo-options";

const OVERLAY_OPTIONS: { value: TSearchOverlayMode; label: string }[] = [
  { value: "empty", label: "Без запроса" },
  { value: "active", label: "Всегда" },
  { value: "none", label: "Нет" },
];

const RESTORE_OPTIONS: { value: "previous" | "show"; label: string }[] = [
  { value: "previous", label: "Как было" },
  { value: "show", label: "Показать" },
];

const CANCEL_OPTIONS: {
  value: ISearchHiddenBarOptions["cancel"];
  label: string;
}[] = [
  { value: "active", label: "В поиске" },
  { value: "always", label: "Всегда" },
  { value: "never", label: "Нет" },
];

interface ISearchHiddenBarSettingsProps {
  options: ISearchHiddenBarOptions;
  onChange: (options: ISearchHiddenBarOptions) => void;
}

/** Настройки демо: оверлей, шапка при открытии и закрытии, «Отмена». */
export const SearchHiddenBarSettings: FC<ISearchHiddenBarSettingsProps> = memo(
  ({ options, onChange }) => (
    <Col gap={10} pv={8}>
      <Text textStyle={"Caption_M3"} color={"textSecondary"}>
        {"Оверлей (недавние, подсказки, результаты)"}
      </Text>
      <Segmented
        options={OVERLAY_OPTIONS}
        value={options.overlay}
        onValueChange={overlay => onChange({ ...options, overlay })}
      />
      <SwitchRow
        label={"Прятать шапку при поиске"}
        value={options.hideBar}
        onValueChange={hideBar => onChange({ ...options, hideBar })}
      />
      <Text textStyle={"Caption_M3"} color={"textSecondary"}>
        {"Шапка после закрытия"}
      </Text>
      <Segmented
        options={RESTORE_OPTIONS}
        value={options.restore}
        onValueChange={restore => onChange({ ...options, restore })}
      />
      <Text textStyle={"Caption_M3"} color={"textSecondary"}>
        {"Кнопка «Отмена»"}
      </Text>
      <Segmented
        options={CANCEL_OPTIONS}
        value={options.cancel}
        onValueChange={cancel => onChange({ ...options, cancel })}
      />
    </Col>
  ),
);
