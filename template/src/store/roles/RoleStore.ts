import { IApiService } from "@api";
import { IRoleDto, TPermission, TRole } from "@api/api-gen/data-contracts";
import { CollectionHolder, MutationHolder } from "@store/holders";
import { makeAutoObservable } from "mobx";

import { IRoleStore } from "./RoleStore.types";

@IRoleStore({ inSingleton: true })
export class RoleStore implements IRoleStore {
  public rolesHolder = new CollectionHolder<IRoleDto>({
    onFetch: () => this._api.getRoles(),
  });

  public createMutation = new MutationHolder<void, IRoleDto>();
  public deleteMutation = new MutationHolder();

  constructor(@IApiService() private _api: IApiService) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  async loadRoles() {
    await this.rolesHolder.load();
  }

  async createRole(name: TRole) {
    await this.createMutation.run(async () => {
      const res = await this._api.createRole({ name });

      if (res.data) {
        this.rolesHolder.appendItem(res.data);
      }

      return res;
    });
  }

  async deleteRole(roleId: string) {
    await this.deleteMutation.run(async () => {
      const res = await this._api.deleteRole({ id: roleId });

      if (!res.error) {
        this.rolesHolder.removeItem(r => r.id === roleId);
      }

      return res;
    });
  }

  async setPermissions(roleId: string, permissions: TPermission[]) {
    const res = await this._api.setRolePermissions(
      { id: roleId },
      { permissions },
    );

    if (res.data) {
      this.rolesHolder.updateItem(r => r.id === roleId, res.data);
    }
  }
}
