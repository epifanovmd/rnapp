import type { NodeDto } from "@shared/api/gen/main/model";

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

/** IP без порта и квадратных скобок: «[2001:db8::1]:443» → «2001:db8::1». */
const bareIp = (address: string): string => {
  const value = address.trim();
  const bracketed = /^\[([^\]]+)\](?::\d+)?$/.exec(value);

  if (bracketed) return bracketed[1].toLowerCase();

  const withPort = /^([\d.]+):\d+$/.exec(value);

  return (withPort ? withPort[1] : value).toLowerCase();
};

const isIp = (value: string): boolean =>
  IPV4.test(value) || value.includes(":");

/**
 * Агент подключается не с адреса узла. Сравнить можно, только когда адрес
 * узла — IP: имя хоста без DNS не проверить.
 */
export const nodeAddressMismatch = (
  node: Pick<NodeDto, "host" | "agent">,
): boolean => {
  const address = node.agent?.address;

  if (!node.host || !address) return false;

  const host = bareIp(node.host);

  return isIp(host) && host !== bareIp(address);
};
