export interface UserCreationResponse {

  success: boolean;
  userId?: string;
  temporaryPassword?: string;
  message: string;
  errors?: string[];

}
