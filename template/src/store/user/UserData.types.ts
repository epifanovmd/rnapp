import { IUserDto } from "@api/api-gen/data-contracts";
import { createServiceDecorator, DataHolder } from "@force-dev/utils";

export const IUserDataStore = createServiceDecorator<IUserDataStore>();

export interface IUserDataStore {
  holder: DataHolder<IUserDto>;
  user?: IUserDto;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;

  getUser(): Promise<IUserDto | undefined>;
}
