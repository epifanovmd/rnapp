import { autorun, observable, runInAction } from "mobx";

import { DataModelBase } from "../data-model-base";
import { createEnumModelBase } from "../enum-model-base";

interface IDto {
  id: number;
  name: string;
  tags: string[];
}

class DtoModel extends DataModelBase<IDto> {}

enum Status {
  Active = "active",
  Blocked = "blocked",
}

const StatusModel = createEnumModelBase<typeof Status>(Status);

describe("DataModelBase", () => {
  it("data — тот же объект DTO, без observable-копии", () => {
    const dto: IDto = { id: 1, name: "a", tags: ["x"] };
    const model = new DtoModel(dto);

    expect(model.data).toBe(dto);
    expect(model.data.tags).toBe(dto.tags);
  });

  it("лямбда-источник: data следует за observable-значением", () => {
    const source = observable.box<IDto>({ id: 1, name: "a", tags: [] });
    const model = new DtoModel(() => source.get());
    const seen: string[] = [];

    const dispose = autorun(() => seen.push(model.data.name));

    runInAction(() => source.set({ id: 1, name: "b", tags: [] }));
    dispose();

    expect(seen).toEqual(["a", "b"]);
    expect(model.hasLambda).toBe(true);
  });

  it("поля DTO доступны только через data", () => {
    const model = new DtoModel({ id: 1, name: "a", tags: [] });

    expect("name" in model).toBe(false);
  });
});

describe("createEnumModelBase", () => {
  it("isX отражают текущее значение", () => {
    const source = observable.box<Status>(Status.Active);
    const model = new StatusModel(() => source.get()) as InstanceType<
      typeof StatusModel
    >;

    expect(model.isActive).toBe(true);
    expect(model.isBlocked).toBe(false);

    runInAction(() => source.set(Status.Blocked));

    expect(model.isBlocked).toBe(true);
  });
});
