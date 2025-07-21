import { AccountantUser, AdminUser, BaseUser, FinancialUser, StoreUser, VendorUser } from "../modelos/clases-herencia";
import { UserType } from "../modelos/enums";
import { BaseProfile } from "../modelos/interface-base";

export class UserFactory {
  static createUser(
    userType: UserType,
    profile: Omit<BaseProfile, 'uid' | 'createdAt' | 'updatedAt' | 'isActive' | 'userType'>,
    additionalData: any
  ): BaseUser {
    const baseProfile = { ...profile, userType };

    switch (userType) {
      case UserType.ADMIN:
        return new AdminUser(baseProfile);

      case UserType.STORE:
        return new StoreUser(baseProfile, additionalData.storeInfo);

      case UserType.VENDOR:
        return new VendorUser(
          baseProfile,
          additionalData.vendorInfo,
          additionalData.storeAssignments || []
        );

      case UserType.ACCOUNTANT:
        return new AccountantUser(baseProfile, additionalData.accountantInfo);

      case UserType.FINANCIAL:
        return new FinancialUser(baseProfile, additionalData.financialInfo);

      default:
        throw new Error(`Tipo de usuario no soportado: ${userType}`);
    }
  }
}
