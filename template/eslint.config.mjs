import reactNativeConfig from "@react-native/eslint-config/flat";
import simpleImportSort from "eslint-plugin-simple-import-sort";

import { boundariesConfig } from "./eslint.boundaries.mjs";
import { namingConfig } from "./eslint.naming.mjs";

/**
 * Сегменты Shared — self-import запрещён внутри своего же сегмента.
 * `lib` сюда сознательно не входит: в отличие от ui/api/config это не цельный
 * модуль, а плоская россыпь независимых тем (di, models, utils, theme, socket,
 * holders, ...) — им разрешено ссылаться друг на друга через алиас.
 */
const SHARED_SEGMENTS = ["ui", "api", "config"];

/** Слайсы entities/features/widgets/pages — self-import запрещён внутри своего же слайса. */
const SLICE_LAYERS = {
  entities: ["auth", "user"],
  features: ["sign-in", "sign-up", "recovery-password", "biometric"],
  widgets: ["chat-room", "app-shell"],
  pages: ["sign-in", "sign-up", "recovery-password", "chat", "settings", "ui-kit-demo"],
};

const selfImportRestriction = (files, group, message) => ({
  files,
  rules: {
    "no-restricted-imports": ["error", { patterns: [{ group, message }] }],
  },
});

const sharedSelfImportRestrictions = SHARED_SEGMENTS.map(seg =>
  selfImportRestriction(
    [`src/shared/${seg}/**`],
    [`@shared/${seg}/*`, `@shared/${seg}`],
    `Внутри shared/${seg}/ используй относительные пути вместо @shared/${seg}/*`,
  ),
);

const sliceSelfImportRestrictions = Object.entries(SLICE_LAYERS).flatMap(
  ([layer, slices]) =>
    slices.map(slice =>
      selfImportRestriction(
        [`src/${layer}/${slice}/**`],
        [`@${layer}/${slice}/*`, `@${layer}/${slice}`],
        `Внутри ${layer}/${slice}/ используй относительные пути вместо @${layer}/${slice}/*`,
      ),
    ),
);

const moduleSelfImportRestrictions = [
  ...sharedSelfImportRestrictions,
  ...sliceSelfImportRestrictions,
];

export default [
  { ignores: ["src/shared/api/gen/**"] },
  ...reactNativeConfig,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      // react-hooks: те же доп. правила, что в react-vite
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
  ...moduleSelfImportRestrictions,
  boundariesConfig,
  namingConfig,
];
