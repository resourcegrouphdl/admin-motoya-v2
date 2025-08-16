import {DocumentType, UserType} from "../models/user-type.type";
import {SpecificFormData} from "./specific-form-data";

export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentType: DocumentType;
  documentNumber: string;
  userType: UserType;
  storeIds?: string[];

  specificData: SpecificFormData;
}
