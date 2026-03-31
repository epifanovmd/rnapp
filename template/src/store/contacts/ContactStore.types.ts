import {
  ContactDto,
  EContactStatus,
  GetContactsParams,
  ICreateContactBody,
  PublicProfileDto,
} from "@api/api-gen/data-contracts";
import { createServiceDecorator } from "@di";
import { CollectionHolder, MutationHolder } from "@store/holders";
import { ContactModel } from "@store/models";

export const IContactStore = createServiceDecorator<IContactStore>();

export interface IContactStore {
  contactsHolder: CollectionHolder<ContactDto, GetContactsParams>;
  addMutation: MutationHolder<ICreateContactBody, ContactDto>;

  allContacts: ContactModel[];
  acceptedContacts: ContactModel[];
  pendingContacts: ContactModel[];
  blockedContacts: ContactModel[];
  isLoading: boolean;

  load(status?: EContactStatus): Promise<void>;
  addContact(contactUserId: string, displayName?: string): Promise<void>;
  acceptContact(contactId: string): Promise<void>;
  removeContact(contactId: string): Promise<void>;
  blockContact(contactId: string): Promise<void>;

  handleContactRequest(contact: ContactDto): void;
  handleContactAccepted(contact: ContactDto): void;
  handleProfileUpdated(profile: PublicProfileDto): void;
}
