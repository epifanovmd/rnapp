import {makeAutoObservable} from 'mobx';
import {IUsersDataStore, UsersDataStore} from '../../../store';
import {iocDecorator} from '@force-dev/utils';
import {iocHook} from '@force-dev/react-mobile';

export const IUsersVM = iocDecorator<UsersVm>();
export const useUsersVM = iocHook(IUsersVM);

@IUsersVM()
export class UsersVm {
  private search: string = '';

  constructor(@IUsersDataStore() private _usersDataStore: UsersDataStore) {
    makeAutoObservable(this, {}, {autoBind: true});
  }

  get list() {
    return (this._usersDataStore.holder.d || []).filter(
      item =>
        item.name.includes(this.search || '') ||
        item.email.includes(this.search || '') ||
        item.website.includes(this.search || '') ||
        item.username.includes(this.search || '') ||
        item.phone.includes(this.search || ''),
    );
  }

  get loading() {
    return this._usersDataStore.loading;
  }

  get loaded() {
    return this._usersDataStore.loaded;
  }

  onSearch(search: string) {
    this.search = search;
  }

  onRefresh() {
    return this._usersDataStore.onRefresh();
  }
}
