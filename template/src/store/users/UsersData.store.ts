import {iocDecorator, ListCollectionHolder} from '@force-dev/utils';
import {RefreshArgs} from '@force-dev/utils/src/store/holders/ListCollectionHolder.ts';
import {makeAutoObservable} from 'mobx';
import {IUser, IUsersService, UsersService} from '../../service';

export const IUsersDataStore = iocDecorator<UsersDataStore>();

@IUsersDataStore()
export class UsersDataStore {
  public holder: ListCollectionHolder<IUser> = new ListCollectionHolder();

  constructor(@IUsersService() private _usersService: UsersService) {
    makeAutoObservable(this, {}, {autoBind: true});
    this.holder.initialize({
      pageSize: 10,
      onFetchData: this._onRefresh,
      keyExtractor: item => item.id,
    });
  }

  get error() {
    return this.holder.error;
  }

  get loading() {
    return this.holder.isLoading;
  }

  get loaded() {
    return this.holder.isReady;
  }

  async onRefresh() {
    return this.holder.performRefresh();
  }

  private async _onRefresh(_params: RefreshArgs) {
    this.holder.setLoading();
    const res = await this._usersService.getUsers();

    if (res.error) {
      this.holder.setError({msg: res.error.toString()});
    } else if (res.data) {
      this.holder.updateData(res.data);

      return res.data;
    }

    return [];
  }
}
