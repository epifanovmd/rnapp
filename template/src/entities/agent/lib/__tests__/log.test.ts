import {
  appendLogEntries,
  formatLogEntry,
  type IAgentLogEntry,
  isLogLevelShown,
} from "../log";

const entry = (level: IAgentLogEntry["level"], msg = "m"): IAgentLogEntry => ({
  at: Date.UTC(2026, 9, 8, 10, 0, 0),
  level,
  source: "agent",
  msg,
});

describe("agent log", () => {
  it("показываются записи не ниже уровня", () => {
    expect(isLogLevelShown(entry("warn"), "info")).toBe(true);
    expect(isLogLevelShown(entry("debug"), "info")).toBe(false);
  });

  it("журнал держит последние записи", () => {
    const next = appendLogEntries(
      [entry("info", "1"), entry("info", "2")],
      [entry("info", "3")],
      2,
    );

    expect(next.map(e => e.msg)).toEqual(["2", "3"]);
  });

  it("строка журнала с источником и атрибутами", () => {
    const line = formatLogEntry({
      ...entry("warn", "диск"),
      attrs: { mount: "/", used: 91 },
    });

    expect(line).toMatch(/WARN {2}\[agent\] диск mount=\/ used=91$/);
  });
});
