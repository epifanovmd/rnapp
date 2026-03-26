import {
  EPermissions,
  ERole,
  IProfileUpdateRequestDto,
  ISignInRequestDto,
  ITokensDto,
  TSignUpRequestDto,
  UserDto,
} from "@api/api-gen/data-contracts";
import { createServiceDecorator } from "@common/ioc";
import { IEntityHolderResult, IHolderError } from "@core/holders";

export enum AuthStatus {
  Idle = "idle",
  Loading = "loading",
  Authenticated = "authenticated",
  Unauthenticated = "unauthenticated",
}

export const IAuthStore = createServiceDecorator<IAuthStore>();

export interface IAuthStore {
  readonly status: AuthStatus;
  readonly user: UserDto | null;
  readonly error: string | undefined;
  readonly isIdle: boolean;
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  readonly isReady: boolean;

  /** Current user roles */
  readonly roles: ERole[];
  /** Direct permissions assigned to the user */
  readonly directPermissions: EPermissions[];
  /** Effective permissions = union(role permissions) + directPermissions */
  readonly permissions: EPermissions[];
  /** true if user has Admin role (superadmin bypass) */
  readonly isAdmin: boolean;

  /** Check permission with wildcard hierarchy (admin always returns true) */
  hasPermission(required: EPermissions): boolean;

  load(): Promise<IEntityHolderResult<UserDto, IHolderError>>;
  signIn(params: ISignInRequestDto): Promise<void>;
  signUp(params: TSignUpRequestDto): Promise<void>;
  updateProfile(data: IProfileUpdateRequestDto): Promise<void>;
  restore(tokens?: ITokensDto): Promise<void>;
  signOut(): void;
}
