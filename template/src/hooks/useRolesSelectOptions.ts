import { useApi } from "@api";
import {
  IRoleDto,
  KnownPermission,
  KnownRole,
} from "@api/api-gen/data-contracts";
import { RoleModel } from "@store/models";
import { useCallback, useEffect, useState } from "react";

export const useRolesSelectOptions = () => {
  const api = useApi();
  const [roles, setRoles] = useState<IRoleDto[]>([]);

  const load = useCallback(() => {
    return api
      .getRoles()
      .then(res => setRoles((res.data ?? []).sort()))
      .catch(() => {});
  }, [api]);

  useEffect(() => {
    load().then();
    // eslint-disable-next-line
  }, []);

  const options = roles.map(r => {
    const model = new RoleModel(r.name);

    return {
      value: r.name as KnownRole,
      label: model.label,
    };
  });

  const getRolePermissions = useCallback(
    (roleName: string): KnownPermission[] => {
      const role = roles.find(r => r.name === roleName);

      return role?.permissions.map(p => p.name as KnownPermission) ?? [];
    },
    [roles],
  );

  return { options, roles, getRolePermissions, load };
};
