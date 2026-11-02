/**
 * Версия приложения для подписи: `1.2.0 (42)`. Номер сборки опускается, если
 * его нет или он совпадает с версией (Android без versionCode, web).
 */
export const formatAppVersion = (version: string, buildNumber?: string) => {
  const build = buildNumber?.trim();

  return build && build !== version ? `${version} (${build})` : version;
};
