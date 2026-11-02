/** Параметры проекта для `scripts/docs/check.mjs` (docs/00-meta/authoring.md). */
export default {
  /** Корень исходников. */
  srcDir: "src",
  /** Папки, каждая подпапка которых — модуль с обязательным README. */
  moduleParents: [
    "pages/stack",
    "pages/tabs",
    "widgets",
    "features",
    "entities",
    "shared/lib",
  ],
  /** Модули-одиночки с обязательным README. */
  moduleSingles: ["app", "shared/ui", "shared/api", "shared/config"],
  /** Порядок слоёв в индексе модулей. */
  moduleLayers: ["app", "pages", "widgets", "features", "entities", "shared"],
  claudeMdMaxLines: 150,
  docMaxLines: 200,
  /** Каталоги, которые проверка не обходит. */
  skipDirs: ["vendor", "Pods", "build", ".gradle", ".cxx"],
};
