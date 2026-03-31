import {
  DeleteFileParams,
  GetFileByIdParams,
  IFileDto,
} from "@api/api-gen/data-contracts";
import { createServiceDecorator } from "@di";
import { EntityHolder, MutationHolder } from "@store/holders";

export const IFileUploadStore = createServiceDecorator<IFileUploadStore>();

export interface IFileUploadStore {
  fileHolder: EntityHolder<IFileDto, GetFileByIdParams>;
  uploadMutation: MutationHolder<File, IFileDto[]>;
  deleteMutation: MutationHolder<DeleteFileParams, boolean>;

  isUploading: boolean;

  upload(file: File): Promise<IFileDto[]>;
  uploadMultiple(files: File[]): Promise<IFileDto[]>;
}
