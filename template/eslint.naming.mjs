import checkFile from "eslint-plugin-check-file";

/**
 * Конвенции именования файлов/папок, проверяемые автоматически через
 * eslint-plugin-check-file. Слайсы адресуются через generic `*` по сегменту,
 * без перечисления конкретных имён (auth, sign-in, ...).
 */

const SLICE_GLOBS = [
  "src/entities/*",
  "src/features/*",
  "src/widgets/*",
  "src/pages/*",
];

// `use[A-Z]*`/`create[A-Z]*`/`build[A-Z]*`, а не `use*` и т.п. — иначе задевает
// случайные совпадающие префиксы в обычных kebab-словах.
const VERB_PREFIX = "@(use[A-Z]*|create[A-Z]*|build[A-Z]*)";

// RN codegen (TurboModule/Fabric) требует конкретное имя файла для спек-модулей —
// это framework-соглашение, не наша конвенция, поэтому исключаем из проверки.
const NATIVE_SPEC = "@(NativeChatViewSpec|NativeInputBarSpec|NativeContextMenuViewSpec)";

const NOT_VERB_PREFIX = `!(${VERB_PREFIX.slice(2, -1)}|${NATIVE_SPEC.slice(2, -1)})`;

// .tsx: компонент — PascalCase; фабрика/хук с JSX — camelCase по имени экспорта.
const tsxRules = glob => ({
  [`${glob}/**/${NOT_VERB_PREFIX}.tsx`]: "PASCAL_CASE",
  [`${glob}/**/${VERB_PREFIX}.tsx`]: "CAMEL_CASE",
});

// .ts: хук/фабрика — camelCase по имени экспорта; всё остальное — kebab-case.
const tsRules = glob => ({
  [`${glob}/**/${VERB_PREFIX}.ts`]: "CAMEL_CASE",
  [`${glob}/**/${NOT_VERB_PREFIX}.ts`]: "KEBAB_CASE",
});

export const namingConfig = {
  files: ["src/**/*.{ts,tsx}"],
  plugins: { "check-file": checkFile },
  rules: {
    "check-file/filename-naming-convention": [
      "error",
      {
        ...Object.assign({}, ...SLICE_GLOBS.map(tsxRules)),
        ...Object.assign({}, ...SLICE_GLOBS.map(tsRules)),

        // app/*.{ts,tsx} (без вложенных папок). `App.*` — исторически сложившийся
        // композиционный неймспейс (App.tsx, App.navigator.tsx, App.screens.ts, ...),
        // не подчиняется общей конвенции. `app-tab-screens.tsx` — модуль с
        // JSX-иконками таб-бара, не компонент, поэтому не PascalCase.
        "src/app/!(app-tab-screens).tsx": "PASCAL_CASE",
        "src/app/!(App.screens|App.linking).ts": "KEBAB_CASE",

        // shared/api, shared/config, shared/lib — без глагольного исключения:
        // хуки здесь уже kebab-case (use-holder-ref.ts), а не camelCase VM-стиль.
        "src/shared/{api,config,lib}/**/*.tsx": "PASCAL_CASE",
        "src/shared/{api,config,lib}/**/*.ts": "KEBAB_CASE",

        // shared/ui — тот же паттерн, что и слайсы выше. `ImageItem` — базовое
        // имя платформенного компонента (ImageItem.ios.tsx/.android.tsx/.d.ts),
        // .d.ts обязан совпадать по имени с самими компонентами.
        ...tsxRules("src/shared/ui"),
        [`src/shared/ui/**/!(${NOT_VERB_PREFIX.slice(2, -1)}|ImageItem*).ts`]:
          "KEBAB_CASE",
      },
      { ignoreMiddleExtensions: true },
    ],

    "check-file/folder-naming-convention": [
      "error",
      { "src/**/": "KEBAB_CASE" },
      { ignoreWords: ["_app", "_auth"] },
    ],
  },
};

export default namingConfig;
