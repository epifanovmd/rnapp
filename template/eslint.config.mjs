import reactNativeConfig from "@react-native/eslint-config/flat";
import simpleImportSort from "eslint-plugin-simple-import-sort";

import { boundariesConfig } from "./eslint.boundaries.mjs";
import { namingConfig } from "./eslint.naming.mjs";

export default [
  { ignores: ["src/shared/api/gen/**"] },
  ...reactNativeConfig,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "react/no-multi-comp": ["error", { ignoreStateless: false }],
      // react-hooks: дополнительные правила
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": [
        "error",
        {
          additionalHooks: "(useMyCustomHook|useMyOtherCustomHook)",
        },
      ],

      // simple-import-sort
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",

      // react
      "react/display-name": "off",
      "react/prop-types": "off",
      "react/jsx-uses-react": "error",
      "react/jsx-uses-vars": "error",

      "no-undef": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",

      // typescript eslint
      "@typescript-eslint/ban-types": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",

      // Stylistic
      "no-redeclare": "off",
      "padding-line-between-statements": [
        "error",
        {
          blankLine: "always",
          prev: ["const", "let", "var"],
          next: "*",
        },
        {
          blankLine: "always",
          prev: "*",
          next: "return",
        },
        {
          blankLine: "any",
          prev: ["const", "let", "var"],
          next: ["const", "let", "var"],
        },
      ],
    },
  },
  {
    // Проектное правило: все функции — стрелочные (`const f = () => {}`),
    // `function`-объявления и `function`-выражения запрещены.
    // Исключения: сгенерированный код (orval — уже в глобальных ignores),
    // `.d.ts` и codegen-спеки нативных модулей (TurboModule/Fabric/Nitro) —
    // их синтаксис диктует codegen, править вручную нельзя.
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/shared/api/gen/**",
      "**/*.d.ts",
      "**/specs/**",
      "**/*NativeComponent.ts",
      "**/Native*.ts",
      "**/*.nitro.ts",
    ],
    rules: {
      "func-style": ["error", "expression"],
      "prefer-arrow-callback": "error",
    },
  },
  boundariesConfig,
  namingConfig,
];
