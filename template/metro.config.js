const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const path = require("path");

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */

/**
 * Библиотеки, подключённые из соседних папок через `link:`.
 *
 * Metro смотрит только внутрь проекта, поэтому папку с исходниками нужно
 * добавить в наблюдаемые — иначе символическая ссылка ведёт в неизвестное
 * дерево, и модуль не резолвится.
 */
const LINKED_PACKAGES = [path.resolve(__dirname, "../../anchor-list")];

/**
 * Пакеты, которых в приложении обязан быть ровно один экземпляр.
 *
 * У связанной библиотеки свои `node_modules` со своими копиями React и
 * Reanimated, и резолв от её файлов нашёл бы сначала их: два React'а — два
 * дерева, два Reanimated — два UI-рантайма, и worklet'ы перестают видеть общие
 * shared values. Копии закрываются от Metro, а имена уводятся в `node_modules`
 * приложения.
 */
const SINGLETON_PACKAGES = [
  "react",
  "react-native",
  "react-native-reanimated",
  "react-native-worklets",
];

const escapeForRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const defaultConfig = getDefaultConfig(__dirname);

const linkedCopiesPattern = LINKED_PACKAGES.flatMap(packagePath =>
  SINGLETON_PACKAGES.map(
    name =>
      `^${escapeForRegExp(path.join(packagePath, "node_modules", name))}\\/.*$`,
  ),
).join("|");

const config = {
  watchFolders: LINKED_PACKAGES,
  resolver: {
    blockList: new RegExp(
      `${defaultConfig.resolver.blockList.source}|${linkedCopiesPattern}`,
    ),
    extraNodeModules: Object.fromEntries(
      SINGLETON_PACKAGES.map(name => [
        name,
        path.join(__dirname, "node_modules", name),
      ]),
    ),

    resolveRequest: function packageExportsResolver(
      context,
      moduleImport,
      platform,
    ) {
      // Use the browser version of the package for React Native
      if (moduleImport === "axios" || moduleImport.startsWith("axios/")) {
        return context.resolveRequest(
          {
            ...context,
            unstable_conditionNames: ["browser"],
          },
          moduleImport,
          platform,
        );
      }

      // Fall back to normal resolution
      return context.resolveRequest(context, moduleImport, platform);
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
