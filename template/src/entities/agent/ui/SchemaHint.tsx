import { Col, Row, Tag, Text } from "@shared/ui";
import React, { FC } from "react";

import { schemaHint } from "../lib/schema";

interface ISchemaHintProps {
  /** JSON Schema значения из манифеста воркера. */
  schema: unknown;
}

/** Подсказка по схеме значения: тип, описание и поля; схемы нет — ничего. */
export const SchemaHint: FC<ISchemaHintProps> = ({ schema }) => {
  const hint = schemaHint(schema);

  if (!hint) return null;

  return (
    <Col gap={6} bg={"onSurface"} radius={12} pa={12}>
      <Text textStyle={"Caption_M2"} color={"textSecondary"}>
        {`Схема значения${hint.type ? ` · ${hint.type}` : ""}`}
      </Text>
      {!!hint.description && (
        <Text textStyle={"Body_S2"}>{hint.description}</Text>
      )}
      {hint.fields.map(field => (
        <Col key={field.path} gap={2}>
          <Row wrap alignItems={"center"} gap={6}>
            <Text textStyle={"Body_S2"}>{field.path}</Text>
            {!!field.type && <Tag variant={"muted"}>{field.type}</Tag>}
            {field.required && <Tag variant={"warning"}>{"обязательное"}</Tag>}
          </Row>
          {!!field.description && (
            <Text textStyle={"Caption_M3"} color={"textSecondary"}>
              {field.description}
            </Text>
          )}
          {field.options.length > 0 && (
            <Text textStyle={"Caption_M3"} color={"textSecondary"}>
              {`одно из: ${field.options.join(", ")}`}
            </Text>
          )}
        </Col>
      ))}
    </Col>
  );
};
