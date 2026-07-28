export type TSignUpRequestDto = (
  | {
      phone: string;
      email?: string;
    }
  | {
      phone?: string;
      email: string;
    }
) & {
  password: string;
  lastName?: string;
  firstName?: string;
};
