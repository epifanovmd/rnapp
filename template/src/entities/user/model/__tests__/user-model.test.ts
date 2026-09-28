import type { IFileDto, UserDto } from "@shared/api/gen/main/model";

import { UserModel } from "../user-model";

const user = (avatar?: Partial<IFileDto>): UserDto =>
  ({
    id: "u1",
    email: "a@b.c",
    phone: null,
    username: null,
    roles: [],
    directPermissions: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    profile: avatar
      ? ({ id: "p1", userId: "u1", avatar } as UserDto["profile"])
      : undefined,
  }) as UserDto;

describe("UserModel.avatarUrl", () => {
  it("предпочитает превью оригиналу", () => {
    const model = new UserModel(
      user({ id: "f1", url: "orig", thumbnailUrl: "thumb" }),
    );

    expect(model.avatarUrl).toBe("thumb");
    expect(model.avatarId).toBe("f1");
  });

  it("без превью отдаёт оригинал", () => {
    expect(
      new UserModel(user({ id: "f1", url: "orig", thumbnailUrl: null }))
        .avatarUrl,
    ).toBe("orig");
  });

  it("без аватара — undefined", () => {
    expect(new UserModel(user()).avatarUrl).toBeUndefined();
  });
});
