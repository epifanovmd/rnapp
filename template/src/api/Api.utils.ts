import { BASE_URL } from "./Api.service";

export const noop = () => {};

export const hostname = (BASE_URL ?? "").replace("api/", "") || "/";

export const toAbsoluteUrl = (url?: string) => {
  if (!url) {
    return undefined;
  }

  const regexp = new RegExp(/(http(s?)|file):\/\//);

  if (regexp.test(url) || url.includes("://")) {
    return url;
  }

  return `${hostname}${url}`.replace("///", "//");
};
