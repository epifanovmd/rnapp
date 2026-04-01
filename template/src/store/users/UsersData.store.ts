import { IApiService } from "@api";
import {
  IUserPrivilegesRequestDto,
  IUserUpdateRequestDto,
  PublicUserDto,
  TSignUpRequestDto,
  UserDto,
} from "@api/api-gen/data-contracts";
import { EntityHolder, MutationHolder, PagedHolder } from "@store";
import { createModelMapper, PublicUserModel, UserModel } from "@store/models";
import { makeAutoObservable } from "mobx";

import { IUsersDataStore } from "./UsersData.types";

@IUsersDataStore({ inSingleton: true })
export class UsersDataStore implements IUsersDataStore {
  public listHolder = new PagedHolder<PublicUserDto>({
    keyExtractor: u => u.userId,
    pageSize: 1000,
    onFetch: pagination => this._apiService.getUsers(pagination),
  });
  public userHolder = new EntityHolder<UserDto, string>({
    onFetch: id => this._apiService.getUserById({ id }),
  });
  public privilegesMutation = new MutationHolder<
    IUserPrivilegesRequestDto,
    UserDto
  >();
  public deleteUserMutation = new MutationHolder<string, boolean>();

  private _toModels = createModelMapper<PublicUserDto, PublicUserModel>(
    u => u.userId,
    u => new PublicUserModel(u),
  );

  constructor(@IApiService() private _apiService: IApiService) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get models() {
    return this._toModels(this.listHolder.items);
  }

  get isLoading() {
    return this.listHolder.isLoading;
  }

  get total() {
    return this.listHolder.pagination.totalCount;
  }

  get user() {
    return this.userHolder.data;
  }

  get userModel() {
    if (!this.userHolder.data) return null;

    return new UserModel(this.userHolder.data);
  }

  async load() {
    await this.listHolder.load();
  }

  async loadUser(id: string) {
    const res = await this.userHolder.load(id);

    return res.data;
  }

  async updateUser(id: string, params: IUserUpdateRequestDto) {
    const res = await this._apiService.updateUser({ id }, params);

    if (res.data) {
      this.userHolder.setData(res.data);
      this.listHolder.removeItem(id);
    }

    return res;
  }

  async setPrivileges(id: string, params: IUserPrivilegesRequestDto) {
    return this.privilegesMutation.execute(params, async args => {
      const res = await this._apiService.setPrivileges({ id }, args);

      if (res.data) {
        this.userHolder.setData(res.data);
      }

      return res;
    });
  }

  async deleteUser(id: string) {
    return this.deleteUserMutation.execute(id, async args => {
      const res = await this._apiService.deleteUser({ id: args });

      if (!res.error) {
        this.listHolder.removeItem(args);
      }

      return res;
    });
  }

  async getUserByUsername(username: string) {
    return this._apiService.getUserByUsername({ username });
  }

  async searchUsers(query: string, limit = 20) {
    return this._apiService.searchUsers({ q: query, limit });
  }

  async getUserOptions(query?: string) {
    return this._apiService.getUserOptions({ query });
  }

  async createUser(
    data: TSignUpRequestDto,
    privileges?: IUserPrivilegesRequestDto,
  ) {
    const res = await this._apiService.signUp(data);

    if (!res.data) return null;

    const userId = res.data.id;

    if (privileges) {
      await this._apiService.setPrivileges({ id: userId }, privileges);
    }

    await this.load();

    return res.data as any;
  }
}
