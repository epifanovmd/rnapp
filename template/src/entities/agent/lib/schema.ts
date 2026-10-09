/** Поле значения по JSON Schema: что подсказать рядом с редактором. */
export interface ISchemaField {
  /** Путь через точку: `limits.maxJobs`. */
  path: string;
  type: string | null;
  description: string | null;
  required: boolean;
  /** Допустимые значения (`enum`). */
  options: string[];
}

/** Подсказка по схеме ключа настроек. */
export interface ISchemaHint {
  type: string | null;
  description: string | null;
  fields: ISchemaField[];
}

type TSchema = Record<string, unknown>;

const isRecord = (value: unknown): value is TSchema =>
  !!value && typeof value === "object" && !Array.isArray(value);

/** Глубже не раскрываем: подсказка, а не редактор схемы. */
const MAX_DEPTH = 3;

const typeOf = (schema: TSchema): string | null => {
  const { type } = schema;

  if (typeof type === "string") return type;
  if (Array.isArray(type)) {
    return type.filter(item => typeof item === "string").join(" | ");
  }
  if (Array.isArray(schema.enum)) return "enum";

  return null;
};

const textOf = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value : null;

const optionsOf = (schema: TSchema): string[] =>
  Array.isArray(schema.enum)
    ? schema.enum.map(item => JSON.stringify(item))
    : [];

const fieldsOf = (
  schema: TSchema,
  prefix: string,
  depth: number,
): ISchemaField[] => {
  if (depth >= MAX_DEPTH || !isRecord(schema.properties)) return [];

  const required = new Set(
    Array.isArray(schema.required)
      ? schema.required.filter(name => typeof name === "string")
      : [],
  );

  return Object.entries(schema.properties).flatMap(([name, raw]) => {
    if (!isRecord(raw)) return [];

    const path = prefix ? `${prefix}.${name}` : name;
    const items = isRecord(raw.items) ? raw.items : null;
    const itemType = items ? typeOf(items) : null;
    const field: ISchemaField = {
      path,
      type: typeOf(raw) === "array" && itemType ? `${itemType}[]` : typeOf(raw),
      description: textOf(raw.description) ?? textOf(raw.title),
      required: required.has(name),
      options: optionsOf(raw),
    };
    const nested = items ?? raw;

    return [field, ...fieldsOf(nested, items ? `${path}[]` : path, depth + 1)];
  });
};

/** Подсказка по JSON Schema; схемы нет или она не объект — `null`. */
export const schemaHint = (schema: unknown): ISchemaHint | null => {
  if (!isRecord(schema)) return null;

  return {
    type: typeOf(schema),
    description: textOf(schema.description) ?? textOf(schema.title),
    fields: fieldsOf(schema, "", 0),
  };
};

/**
 * Заготовка значения по схеме: `default`, первое из `enum` или пустое значение
 * типа; у объекта — обязательные поля (нет обязательных — все).
 */
export const schemaSkeleton = (schema: unknown, depth = 0): unknown => {
  if (!isRecord(schema)) return {};
  if (schema.default !== undefined) return schema.default;
  if (Array.isArray(schema.enum) && schema.enum.length) return schema.enum[0];

  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;

  switch (type) {
    case "string":
      return "";
    case "number":
    case "integer":
      return 0;
    case "boolean":
      return false;
    case "array":
      return [];
    case "null":
      return null;
    default: {
      if (depth >= MAX_DEPTH || !isRecord(schema.properties)) return {};

      const properties = schema.properties;
      const required = Array.isArray(schema.required)
        ? schema.required.filter(
            (name): name is string =>
              typeof name === "string" && name in properties,
          )
        : [];
      const names = required.length ? required : Object.keys(properties);

      return Object.fromEntries(
        names.map(name => [name, schemaSkeleton(properties[name], depth + 1)]),
      );
    }
  }
};
