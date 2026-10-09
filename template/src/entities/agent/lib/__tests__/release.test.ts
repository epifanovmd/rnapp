import type { IAgentReleaseDto } from "@shared/api/gen/main/model";

import {
  agentReleaseMessage,
  agentUpdateCandidate,
  releaseWorkerNames,
  workerUpdateCandidate,
} from "../release";

const artifact = (name: string, arch: string) => ({
  os: "linux",
  arch,
  file: `${name}-${arch}`,
  sha256: "0",
  source: "local" as const,
  url: `/releases/${name}-${arch}`,
  name,
  version: "1.0.0",
});

const release: IAgentReleaseDto = {
  manifest: {
    version: "1.1.0",
    artifacts: [],
    workers: [
      artifact("echo", "amd64"),
      artifact("echo", "arm64"),
      artifact("backup", "amd64"),
    ],
  },
  candidates: [
    {
      agentId: "a1",
      name: "example-node",
      online: true,
      current: "1.0.0",
      target: "1.1.0",
      os: "linux",
      arch: "amd64",
    },
  ],
  workerCandidates: [
    {
      agentId: "a1",
      agentName: "example-node",
      online: true,
      worker: "echo",
      current: "1.0.0",
      target: "1.2.0",
      os: "linux",
      arch: "amd64",
    },
  ],
};

describe("agent release", () => {
  it("кандидат агента; агент уже на новой версии — нет кандидата", () => {
    expect(agentUpdateCandidate(release, "a1")?.target).toBe("1.1.0");
    expect(
      agentUpdateCandidate(release, "a1", { version: "1.1.0" }),
    ).toBeNull();
    expect(agentUpdateCandidate(release, "a2")).toBeNull();
    expect(agentUpdateCandidate(null, "a1")).toBeNull();
  });

  it("кандидат воркера по агенту и имени", () => {
    expect(workerUpdateCandidate(release, "a1", "echo")?.target).toBe("1.2.0");
    expect(workerUpdateCandidate(release, "a1", "echo", "1.2.0")).toBeNull();
    expect(workerUpdateCandidate(release, "a1", "backup")).toBeNull();
  });

  it("воркеры с сервера — по имени без повторов, по алфавиту", () => {
    expect(releaseWorkerNames(release)).toEqual(["backup", "echo"]);
    expect(releaseWorkerNames(null)).toEqual([]);
  });

  it("новая версия — уведомление; первое получение сборок — без него", () => {
    expect(
      agentReleaseMessage({
        version: "1.2.0",
        previous: "1.1.0",
        from: "github:example/agent",
      }),
    ).toBe("Доступна версия агента 1.2.0 (была 1.1.0)");
    expect(
      agentReleaseMessage({ version: "1.2.0", from: "github:example/agent" }),
    ).toBeNull();
  });
});
