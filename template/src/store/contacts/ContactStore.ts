import { IApiService } from "@api";
import {
  ContactDto,
  EContactStatus,
  GetContactsParams,
  ICreateContactBody,
  PublicProfileDto,
} from "@api/api-gen/data-contracts";
import { CollectionHolder, MutationHolder } from "@store/holders";
import { ContactModel } from "@store/models";
import { action, makeAutoObservable } from "mobx";

import { IContactStore } from "./ContactStore.types";

@IContactStore({ inSingleton: true })
export class ContactStore implements IContactStore {
  public contactsHolder = new CollectionHolder<ContactDto, GetContactsParams>({
    keyExtractor: c => c.id,
    onFetch: params => this._api.getContacts(params),
  });

  public addMutation = new MutationHolder<ICreateContactBody, ContactDto>();

  constructor(@IApiService() private _api: IApiService) {
    makeAutoObservable(
      this,
      {
        handleContactRequest: action,
        handleContactAccepted: action,
        handleProfileUpdated: action,
      },
      { autoBind: true },
    );
  }

  private get _models(): ContactModel[] {
    return this.contactsHolder.items.map(c => new ContactModel(c));
  }

  get allContacts(): ContactModel[] {
    return this._models;
  }

  get acceptedContacts(): ContactModel[] {
    return this._models.filter(c => c.isAccepted);
  }

  get pendingContacts(): ContactModel[] {
    return this._models.filter(c => c.isPending);
  }

  get blockedContacts(): ContactModel[] {
    return this._models.filter(c => c.isBlocked);
  }

  get isLoading(): boolean {
    return this.contactsHolder.isLoading;
  }

  async load(status?: EContactStatus): Promise<void> {
    await this.contactsHolder.load({ status });
  }

  async addContact(contactUserId: string, displayName?: string): Promise<void> {
    await this.addMutation.execute(
      { contactUserId, displayName },
      async args => {
        const res = await this._api.addContact(args);

        if (res.data) {
          this.contactsHolder.appendItem(res.data);
        }

        return res;
      },
    );
  }

  async acceptContact(contactId: string): Promise<void> {
    const res = await this._api.acceptContact({ id: contactId });

    if (res.data) {
      this.contactsHolder.updateItem(contactId, res.data);
    }
  }

  async removeContact(contactId: string): Promise<void> {
    await this._api.removeContact({ id: contactId });
    this.contactsHolder.removeItem(contactId);
  }

  async blockContact(contactId: string): Promise<void> {
    const res = await this._api.blockContact({ id: contactId });

    if (res.data) {
      this.contactsHolder.updateItem(contactId, res.data);
    }
  }

  handleContactRequest(contact: ContactDto): void {
    const exists = this.contactsHolder.exists(contact.id);

    if (!exists) {
      this.contactsHolder.appendItem(contact);
    }
  }

  handleContactAccepted(contact: ContactDto): void {
    this.contactsHolder.updateItem(contact.id, contact);
  }

  handleProfileUpdated(profile: PublicProfileDto): void {
    const contact = this.contactsHolder.get(profile.userId);

    if (contact?.contactProfile) {
      this.contactsHolder.updateItem(contact.id, {
        ...contact,
        contactProfile: { ...contact.contactProfile, ...profile },
      });
    }
  }
}
