import { IRoleDto, TPermission, TRole } from "@api/api-gen/data-contracts";
import { createServiceDecorator } from "@di";
import { CollectionHolder, MutationHolder } from "@store/holders";

export const IRoleStore = createServiceDecorator<IRoleStore>();

export interface IRoleStore {
  readonly rolesHolder: CollectionHolder<IRoleDto>;
  readonly createMutation: MutationHolder<void, IRoleDto>;
  readonly deleteMutation: MutationHolder;

  loadRoles(): Promise<void>;
  createRole(name: TRole): Promise<void>;
  deleteRole(roleId: string): Promise<void>;
  setPermissions(roleId: string, permissions: TPermission[]): Promise<void>;
}
