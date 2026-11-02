#!/usr/bin/env node
/**
 * Восстановление предсобранных бинарников после `yarn install`.
 *
 * Оба пакета кладут их мимо npm-тарбола, поэтому переустановка зависимостей
 * их сносит:
 *
 * - Skia — xcframework'и лежат в отдельных пакетах `react-native-skia-apple-*`,
 *   а сборке нужны в `@shopify/react-native-skia/libs/<platform>` (то же самое
 *   делает podspec на `pod install`; после нас он видит совпадающий `.version`
 *   и ничего не переделывает);
 * - AudioAPI — ffmpeg/opus/vorbis и jniLibs качает `download-prebuilt-binaries.sh`
 *   пакета (иначе это делают podspec на `pod install` и gradle перед сборкой).
 *
 * Запускается сам из `postinstall`; вручную — `yarn restore:native`.
 * Флаги: `--force` (перекачать/перекопировать), `--skia`, `--audio` (только одно).
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = path.join(ROOT, "node_modules");

const args = process.argv.slice(2);
const force = args.includes("--force");
const only = args.find(a => a === "--skia" || a === "--audio");

const log = msg => console.log(`[native-libs] ${msg}`);

/** Копия каталога: на APFS — клонированием (мгновенно и без расхода места). */
const copyDir = (src, dest) => {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(dest), { recursive: true });

  try {
    execFileSync("cp", ["-Rc", src, dest], { stdio: "inherit" });
  } catch {
    fs.cpSync(src, dest, { recursive: true });
  }
};

// ─── Skia ────────────────────────────────────────────────────────────────────

/** Платформа → пакет с её xcframework'ами. Android читает свой пакет напрямую. */
const SKIA_PACKAGES = {
  ios: "react-native-skia-apple-ios",
  macos: "react-native-skia-apple-macos",
  tvos: "react-native-skia-apple-tvos",
};

const restoreSkia = () => {
  const skia = path.join(MODULES, "@shopify/react-native-skia");

  if (!fs.existsSync(skia)) return log("skia: пакет не установлен, пропуск");

  for (const [platform, pkgName] of Object.entries(SKIA_PACKAGES)) {
    const pkg = path.join(MODULES, pkgName);
    const src = path.join(pkg, "libs");

    if (!fs.existsSync(src)) {
      log(`skia: ${pkgName} не установлен, пропуск ${platform}`);
      continue;
    }

    const version = JSON.parse(
      fs.readFileSync(path.join(pkg, "package.json"), "utf8"),
    ).version;
    const dest = path.join(skia, "libs", platform);
    const marker = path.join(dest, ".version");

    if (
      !force &&
      fs.existsSync(marker) &&
      fs.readFileSync(marker, "utf8").trim() === version
    ) {
      log(`skia: ${platform} уже на месте (${version})`);
      continue;
    }

    log(`skia: копирую ${platform} (${version})`);
    copyDir(src, dest);
    fs.writeFileSync(marker, version);
  }
};

// ─── AudioAPI ────────────────────────────────────────────────────────────────

const restoreAudio = () => {
  const pkg = path.join(MODULES, "react-native-audio-api");
  const script = path.join(pkg, "scripts", "download-prebuilt-binaries.sh");

  if (!fs.existsSync(script)) {
    return log("audio-api: пакет не установлен, пропуск");
  }

  // Скрипт кладёт ffmpeg/opus/vorbis в external, а .so — в android/src/main.
  const targets = [
    // [метка, что проверяем, откуда запускать, аргументы]
    [
      "ios",
      path.join(pkg, "common/cpp/audioapi/external/ffmpeg_ios"),
      pkg,
      ["scripts/download-prebuilt-binaries.sh", "ios"],
    ],
    [
      "android",
      path.join(pkg, "android/src/main/jniLibs"),
      path.join(pkg, "android"),
      ["../scripts/download-prebuilt-binaries.sh", "android"],
    ],
  ];

  for (const [platform, probe, cwd, argv] of targets) {
    if (!force && fs.existsSync(probe)) {
      log(`audio-api: ${platform} уже на месте`);
      continue;
    }

    log(`audio-api: качаю бинарники для ${platform}`);
    execFileSync("bash", argv, { cwd, stdio: "inherit" });
  }
};

if (only !== "--audio") restoreSkia();
if (only !== "--skia") restoreAudio();
