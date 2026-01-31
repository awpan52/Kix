export interface PromoCode {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  description: string;
  active: boolean;
  expirationDate: string | null;
  minimumPurchase: number;
  usageLimit: number | null;
}

export interface AppliedPromo {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  description: string;
  discountAmount: number;
}
