export type PackageTier = 'good' | 'better' | 'best';

export interface PackageDetails {
  scope: string;
  materialLineItems: string;
  laborLineItems: string;
}

export interface FormData {
  siteAddress: string;
  clientType: string;
  summary: string;
  packages: {
    good: PackageDetails;
    better: PackageDetails;
    best: PackageDetails;
  };
  materialMarkupPercent: number;
  laborRate: number;
  constraints: string;
  warranty: number;
  validity: number;
  tax: number;
  discount: number;
  deposit: number;
  currency: string;
  timeline: string;
  brand: string;
  license: string;
  proposalNumberPrefix: string;
}

export interface LineItem {
  desc: string;
  qty: number;
  unit: string;
  rate: number;
  amount: number;
  type: 'material' | 'labor';
}

export interface Quote {
  items: LineItem[];
  totalMaterialCost: number;
  markupAmount: number;
  totalLaborCost: number;
  totalHours: number;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  depositDue: number;
  balanceAfterDeposit: number;
  currency: string;
  materialMarkupPercent: number;
  laborRate: number;
  taxPercent: number;
  discountPercent: number;
  depositPercent: number;
}

export interface UpsellSuggestion {
  name: string;
  description: string;
}
