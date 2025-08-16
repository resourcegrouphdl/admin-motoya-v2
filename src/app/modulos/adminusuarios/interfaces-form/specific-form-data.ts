import {AccessLevel} from "../enums/access-level";

export interface SpecificFormData {
  employeeId: string;
  department: string;
  accessLevel: AccessLevel;

  // Campos opcionales según el tipo
  territory?: string;
  commissionRate?: number;
  managerId?: string;
  warehouseIds?: string[];
  canApproveTransfers?: boolean;
  approvalLimit?: number;
  canApprovePayments?: boolean;
  canModifyUserAccess?: boolean;
  canGenerateInvoices?: boolean;
  sunatAccess?: boolean;
  canModifyPrices?: boolean;
  canCreateProducts?: boolean;
  canModifyContracts?: boolean;
  canAccessSalaries?: boolean;
}
