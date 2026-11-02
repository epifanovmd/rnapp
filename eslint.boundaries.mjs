import boundaries from "eslint-plugin-boundaries";

/**
 * Границы Feature-Sliced Design через eslint-plugin-boundaries.
 *
 * Слой видит только слои строго ниже своего, слайсы одного слоя не видят друг
 * друга, наружу слайс открыт только своим index.ts, внутрь себя — только
 * относительными путями. Исключения: `shared` (сегменты и темы lib ссылаются
 * друг на друга и импортируются вглубь) и `app` (композиционный корень).
 *
 * Имён слайсов здесь нет: элемент — это `src/<layer>/*` (для pages —
 * `src/pages/<группа>/*`), поэтому новый слайс попадает под правила сразу.
 */

// Порядок — правило видимости: слой видит то, что левее.
const LAYERS = ["shared", "entities", "features", "widgets", "pages", "app"];

const SLICE_LAYERS = ["entities", "features", "widgets", "pages"];

const PUBLIC_API = "index.@(ts|tsx)";

// Всё, кроме корневого index: вложенные пути + прочие файлы в корне слайса.
const NOT_PUBLIC_API = ["*/**", "!(index).*"];

const layersBelow = layer => LAYERS.slice(0, LAYERS.indexOf(layer));

const visibleFrom = layer => {
  if (layer === "shared") {
    return ["shared"];
  }

  if (layer === "app") {
    return LAYERS;
  }

  return layersBelow(layer);
};

const element = (type, element = {}) => ({ element: { type, ...element } });

const importTarget = type => ({
  to: element(
    type,
    SLICE_LAYERS.includes(type) ? { fileInternalPath: PUBLIC_API } : {},
  ),
});

const internalImport = { dependency: { relationship: { from: "internal" } } };

const selfAliasImport = {
  dependency: {
    relationship: { from: "internal" },
    source: ["@*", "@*/**"],
  },
};

// `relationship.from: null` — зависимость между независимыми элементами,
// то есть импорт чужого слайса, а не своего.
const deepImport = {
  to: element(SLICE_LAYERS, { fileInternalPath: NOT_PUBLIC_API }),
  dependency: { relationship: { from: [null] } },
};

export const boundariesConfig = {
  files: ["**/*.{ts,tsx}"],
  plugins: { boundaries },
  settings: {
    "import/resolver": {
      typescript: { project: "./tsconfig.json" },
    },

    // Темы shared/lib — отдельные элементы, иначе di/holders/utils не смогли бы
    // ссылаться друг на друга через алиас. Побеждает первый совпавший дескриптор.
    "boundaries/elements": [
      { type: "shared", pattern: "src/shared/lib/*", capture: ["theme"] },
      { type: "shared", pattern: "src/shared/*", capture: ["segment"] },
      { type: "entities", pattern: "src/entities/*", capture: ["slice"] },
      { type: "features", pattern: "src/features/*", capture: ["slice"] },
      { type: "widgets", pattern: "src/widgets/*", capture: ["slice"] },
      // pages сгруппированы по навигаторам: src/pages/{tabs,stack}/<slice>/
      { type: "pages", pattern: "src/pages/*/*", capture: ["group", "slice"] },
      { type: "app", pattern: "src/app" },
    ],
  },
  rules: {
    "boundaries/dependencies": [
      "error",
      {
        default: "disallow",
        // Без этого импорты внутри одного элемента не проверяются вовсе.
        checkInternals: true,
        message:
          "Слой может импортировать только слои строго ниже своего, а слайсы одного слоя не видят друг друга",
        // Побеждает последняя совпавшая политика, поэтому запреты — в конце.
        policies: [
          {
            from: [element(LAYERS)],
            allow: [internalImport],
          },
          ...LAYERS.map(layer => ({
            from: [element(layer)],
            allow: visibleFrom(layer).map(importTarget),
          })),
          {
            from: [element(LAYERS)],
            disallow: [deepImport],
            message:
              "Импортируй слайс через его публичный API (корневой index.ts)",
          },
          {
            from: [element(LAYERS)],
            disallow: [selfAliasImport],
            message:
              "Внутри своего слайса/сегмента импортируй по относительному пути, а не через алиас",
          },
        ],
      },
    ],
  },
};

export default boundariesConfig;
