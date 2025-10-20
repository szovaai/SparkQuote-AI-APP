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
  attachments?: string[];
  primaryColor: string;
  secondaryColor: string;
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

export interface GeneratedContent {
  cover_letter: string;
  scope_of_work: string[];
  inclusions: string[];
  exclusions: string[];
  schedule_notes: string;
  payment_schedule: { milestone: string; percent: number }[];
  warranty: string;
  terms_conditions: string[];
  acceptance_block: string;
}

export interface UpsellSuggestion {
  name: string;
  why_it_matters: string;
  line_item: string; // e.g., "desc | qty | unit | rate"
}

export interface PackageComparison {
  differences: string[];
  who_should_choose: {
    [key in PackageTier]: string;
  };
  risk_notes: string[];
}

export interface FollowUpEmail {
  subject: string;
  body: string;
}

export interface ChangeOrder {
  change_order_summary: string;
  added_scope: string[];
  removed_scope: string[];
  price_delta: {
    items: string[]; // "desc | qty | unit | rate"
    notes: string;
  };
  schedule_delta: string;
}