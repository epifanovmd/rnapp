import type { IPermissionCatalogItemDto } from "./iPermissionCatalogItemDto";

/**
 * Группа прав каталога (обычно — сущность домена).
 */
export interface IPermissionCatalogGroupDto {
  /** `*`, `<домен>` или `<домен>:<сущность>`. */
  key: string;
  label: string;
  permissions: IPermissionCatalogItemDto[];
}
