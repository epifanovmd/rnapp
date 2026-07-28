export interface ICreatePollBody {
  question: string;
  options: string[];
  isAnonymous?: boolean;
  isMultipleChoice?: boolean;
}
