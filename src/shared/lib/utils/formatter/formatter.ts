import { DateFormatter } from "./date-formatter";

/** Индекс единицы измерения в пределах таблицы `units`. */
const unitIndex = (value: number, base: number, units: string[]) =>
  Math.min(
    units.length - 1,
    Math.max(0, Math.floor(Math.log(value) / Math.log(base))),
  );

class Formatter {
  readonly date = new DateFormatter();

  bytes = (bytes: number = 0, mode: "bits" | "bytes" = "bytes"): string => {
    if (bytes === 0) return "0 B";
    const base = mode === "bits" ? 1024 : 1000;
    const units =
      mode === "bits"
        ? ["B", "KiB", "MiB", "GiB", "TiB"]
        : ["B", "KB", "MB", "GB", "TB"];
    const i = unitIndex(bytes, base, units);

    return `${(bytes / Math.pow(base, i)).toFixed(1)} ${units[i]}`;
  };

  speed = (bytes: number = 0, mode: "bits" | "bytes" = "bits"): string => {
    if (bytes === 0) return mode === "bits" ? "0 bps" : "0 B/s";

    if (mode === "bytes") {
      const units = ["B/s", "KB/s", "MB/s", "GB/s"];
      const i = unitIndex(bytes, 1000, units);

      return `${(bytes / Math.pow(1000, i)).toFixed(1)} ${units[i]}`;
    }

    const bps = bytes * 8;

    if (bps < 1_000) return `${bps.toFixed(0)} bps`;
    if (bps < 1_000_000) return `${(bps / 1_000).toFixed(1)} Kbps`;
    if (bps < 1_000_000_000) return `${(bps / 1_000_000).toFixed(1)} Mbps`;

    return `${(bps / 1_000_000_000).toFixed(2)} Gbps`;
  };
}

export const formatter = new Formatter();
