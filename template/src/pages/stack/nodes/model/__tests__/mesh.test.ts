import type {
  INodeMeshCellDto,
  INodeMeshDto,
} from "@shared/api/gen/main/model";

import { describeMeshCell, meshKey, meshPairs } from "../mesh";

const cell = (patch: Partial<INodeMeshCellDto>): INodeMeshCellDto => ({
  from: "n1",
  to: "n2",
  method: "icmp",
  sent: 5,
  received: 5,
  lossPct: 0,
  rttAvgMs: 12.4,
  rttMinMs: 10,
  rttMaxMs: 15,
  at: 1,
  stale: false,
  ...patch,
});

const mesh = (cells: INodeMeshCellDto[]): INodeMeshDto => ({
  nodes: [
    { id: "n1", name: "alpha", host: "203.0.113.1" },
    { id: "n2", name: "beta", host: "203.0.113.2" },
    { id: "n3", name: "gamma", host: null },
  ],
  cells,
  generatedAt: 1,
});

describe("node mesh", () => {
  it("пара из двух направлений; асимметрия задержки — через «/»", () => {
    const [pair] = meshPairs(
      mesh([cell({}), cell({ from: "n2", to: "n1", rttAvgMs: 8.25 })]),
    );

    expect(pair).toMatchObject({
      aName: "alpha",
      bName: "beta",
      status: "ok",
      rttLabel: "12 / 8.3 мс",
      stale: false,
    });
    expect(pair?.directions).toHaveLength(2);
  });

  it("нет ответа — down, потери — loss; пары без замеров нет", () => {
    expect(
      meshPairs(mesh([cell({ rttAvgMs: null, lossPct: 100 })]))[0]?.status,
    ).toBe("down");
    expect(meshPairs(mesh([cell({ lossPct: 20 })]))[0]?.status).toBe("loss");
    expect(meshPairs(mesh([]))).toEqual([]);
  });

  it("описание круга проверки", () => {
    expect(
      describeMeshCell(
        cell({ stale: true, via: "tcp", lossPct: 20, received: 4 }),
      ),
    ).toBe(
      "нет свежих данных · задержка 10 / 12 / 15 мс · ответов 4 из 5 · потери 20% · icmp → tcp",
    );
    expect(
      describeMeshCell(cell({ rttAvgMs: null, error: "порт закрыт" })),
    ).toBe("порт закрыт · не отвечает · ответов 5 из 5 · потери 0% · icmp");
  });

  it("состав матрицы меняется с именем и адресом узла", () => {
    expect(meshKey([{ id: "n1", name: "a", host: null }])).toBe("n1:a:");
  });
});
