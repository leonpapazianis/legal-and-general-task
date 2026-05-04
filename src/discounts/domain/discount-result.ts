export interface DiscountLineItem {
  readonly discountId: string;
  readonly discountName: string;
  readonly productId: string | null;
  readonly amountOff: number;
  readonly description: string;
}

export interface DiscountResult {
  readonly lines: DiscountLineItem[];
  readonly totalDiscount: number;
  readonly subtotal: number;
  readonly total: number;
}
