#!/usr/bin/env node
/**
 * Генератор ассетов splash-экрана для Android и iOS.
 *
 * Готовит картинки, цвета и сториборд под нативный модуль AppSplash: логотип,
 * бренд, светлая и тёмная темы — одной командой на обе платформы.
 *
 * Запуск: `npm run splash [путь-к-конфигу]` (по умолчанию `splash.config.mjs`).
 *
 * Тему запуска (`BootTheme` в values/styles.xml) и `UILaunchStoryboardName`
 * в Info.plist скрипт не трогает — это разовая настройка проекта.
 */

import { prepareArtworks } from "./artwork.mjs";
import { loadConfig } from "./config.mjs";
import { PLATFORM_WRITERS } from "./platforms/index.mjs";
import { log } from "./utils.mjs";

const main = async () => {
  const configArg = process.argv.slice(2).find(arg => !arg.startsWith("-"));
  const config = await loadConfig(configArg);
  const artworks = await prepareArtworks(config);

  for (const platform of config.platforms) {
    const write = PLATFORM_WRITERS[platform];

    if (!write) {
      throw new Error(`Неизвестная платформа: ${platform}`);
    }

    await write(config, artworks);
  }

  log("✅  Ассеты splash обновлены");
};

main().catch(error => {
  console.error(`❌  ${error.message}`);
  process.exitCode = 1;
});
