import { BASE_URL } from "@shared/config/env";

export const toAbsoluteUrl = (url?: string) => {
  if (!url) {
    return undefined;
  }

  const regexp = new RegExp(/(http(s?)|file):\/\//);

  if (regexp.test(url) || url.includes("://")) {
    return url;
  }

  return `${BASE_URL}${url}`.replace("///", "//");
};
