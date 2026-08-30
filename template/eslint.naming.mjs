import checkFile from "eslint-plugin-check-file";

/**
 * Конвенции именования файлов/папок из ARCHITECTURE.md через
 * eslint-plugin-check-file:
 *
 *   - `use*`/`create*`/`build*` + PascalCase — хук или фабрика, имя файла
 *     совпадает с именем экспорта: `useSignInVM.ts`, `createFormField.tsx`;
 *   - остальные `.tsx` — компонент: `SignInForm.tsx`;
 *   - остальные `.ts` — модуль: `user-model.ts`.
 *
 * Правило одно на весь `src`, имён слоёв и слайсов здесь нет. Единичные
 * исключения живут в самих файлах — строкой `eslint-disable check-file/...`.
 */

// `use[A-Z]*`, а не `use*` — иначе задевает совпадающие префиксы в обычных
// kebab-словах (`user-model.ts` тоже начинается на "use").
const VERB_PREFIX = "@(use[A-Z]*|create[A-Z]*|build[A-Z]*)";
const NOT_VERB_PREFIX = `!(${VERB_PREFIX.slice(2, -1)})`;

// Файлы внутри любого слоя; корневой `src/index.tsx` не в счёт.
const IN_ANY_LAYER = "src/*/**";

// kebab-case плюс папки-конвенции с подчёркиваниями (`__tests__`).
const KEBAB_CASE_FOLDER = "+([a-z0-9])*(-+([a-z0-9]))";
const CONVENTION_FOLDER = `@(__+([a-z0-9])__|${KEBAB_CASE_FOLDER})`;

export const namingConfig = {
  files: ["src/**/*.{ts,tsx}"],
  plugins: { "check-file": checkFile },
  rules: {
    "check-file/filename-naming-convention": [
      "error",
      {
        [`${IN_ANY_LAYER}/${VERB_PREFIX}.{ts,tsx}`]: "CAMEL_CASE",
        [`${IN_ANY_LAYER}/${NOT_VERB_PREFIX}.tsx`]: "PASCAL_CASE",
        [`${IN_ANY_LAYER}/${NOT_VERB_PREFIX}.ts`]: "KEBAB_CASE",
      },
      { ignoreMiddleExtensions: true },
    ],

    "check-file/folder-naming-convention": [
      "error",
      {
        "src/**/": CONVENTION_FOLDER,
      },
    ],
  },
};

export default namingConfig;
