import { UserDto } from "@api/api-gen/data-contracts";
import { createServiceDecorator, DataHolder } from "@force-dev/utils";

export const IUserDataStore = createServiceDecorator<IUserDataStore>();

export interface IUserDataStore {
  holder: DataHolder<UserDto>;
  user?: UserDto;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;

  getUser(): Promise<UserDto | undefined>;
}
