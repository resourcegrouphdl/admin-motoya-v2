// models/proposal.model.ts
export interface Proposal {
  id: string;
  storeId: string;
  storeName: string;
  brand: string;
  model: string;
  proposedPrice: number;
  status: ProposalStatus;
  createdAt: Date;
  evaluatedAt?: Date;
  evaluatorId?: string;
  comments?: string;
  calculations?: FinancingCalculation;
}

export interface FinancingCalculation {
  basePrice: number;
  soatPrice: number; // ~S/. 50-80
  notarialTransfer: number; // ~S/. 150-200
  processingFees: number; // ~S/. 100-150
  totalPrice: number;
  downPaymentOptions: DownPaymentOption[];
  financingOptions: FinancingOption[];
}

export interface DownPaymentOption {
  amount: number;
  percentage: number;
  financedAmount: number;
  plans: PaymentPlan[];
}

export interface FinancingOption {
  amount: number;
  financedAmount: number;
  plans: PaymentPlan[];
}

export interface PaymentPlan {
  fortnights: number; // 16, 20, 24
  fortnightlyPayment: number;
  totalInterest: number;
  tea: number;
}

export enum ProposalStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COUNTER_OFFERED = 'COUNTER_OFFERED',
  DELETED = "DELETED"
}