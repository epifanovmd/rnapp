import { IApiService } from "../../api";
import { IUserResponse, IUsersService } from "./Users.types";

@IUsersService()
export class UsersService implements IUsersService {
  constructor(@IApiService() private _apiService: IApiService) {}

  getUsers() {
    return this._apiService.get<IUserResponse>("users");
  }
}
