import {
  Chip,
  LabeledValue,
  Row,
  Select,
  Switch,
  TagRenderInfo,
  Text,
} from "@shared/ui";
import React, { FC, memo, useState } from "react";

import { TAG_OPTIONS } from "./select-demo-api";

/** Тег выбранного значения как Chip с решёткой. */
const renderHashTag = ({ label, onRemove }: TagRenderInfo) => (
  <Chip text={`#${label}`} isActive rightIcon={"close"} onPress={onRemove} />
);

/** Multi-режимы: теги, maxTagCount, текстом, labelInValue + tagRender, динамический multi. */
export const SelectMultiDemo: FC = memo(() => {
  const [tags, setTags] = useState<string[]>(["react", "mobx"]);
  const [limited, setLimited] = useState<string[]>(
    TAG_OPTIONS.slice(0, 5).map(option => option.value),
  );
  const [plain, setPlain] = useState<string[]>([]);
  const [labeled, setLabeled] = useState<LabeledValue[]>([
    { value: "zod", label: "zod" },
  ]);
  const [isMulti, setIsMulti] = useState(true);
  const [dynamic, setDynamic] = useState<string | string[] | null>([]);
  const [log, setLog] = useState("—");

  const toggleMulti = (next: boolean) => {
    setIsMulti(next);
    setDynamic(prev => {
      const list = Array.isArray(prev) ? prev : prev ? [prev] : [];

      return next ? list : (list[0] ?? null);
    });
  };

  return (
    <>
      <Select
        multi
        clearable
        search
        label={"Теги"}
        description={"Выбор отмечается сразу; «Готово» закрывает шторку"}
        options={TAG_OPTIONS}
        value={tags}
        onChange={setTags}
        onSelect={value => setLog(`+ ${value}`)}
        onDeselect={value => setLog(`− ${value}`)}
      />
      <Text color={"textSecondary"} textStyle={"Caption_M3"}>
        {`onSelect/onDeselect: ${log}`}
      </Text>
      <Select
        multi
        maxTagCount={2}
        label={"maxTagCount = 2"}
        options={TAG_OPTIONS}
        value={limited}
        onChange={setLimited}
      />
      <Select
        multi
        clearable
        tagsDisplay={false}
        label={"Без тегов (через запятую)"}
        options={TAG_OPTIONS}
        value={plain}
        onChange={setPlain}
      />
      <Select
        multi
        labelInValue
        label={"labelInValue + tagRender"}
        options={TAG_OPTIONS}
        value={labeled}
        onChange={setLabeled}
        tagRender={renderHashTag}
      />
      <Row gap={12} alignItems={"center"}>
        <Switch isActive={isMulti} onChange={toggleMulti} />
        <Text>{`multi = ${isMulti}`}</Text>
      </Row>
      <Select
        multi={isMulti}
        clearable
        label={"Динамический multi"}
        options={TAG_OPTIONS}
        value={dynamic}
        onChange={setDynamic}
      />
    </>
  );
});
