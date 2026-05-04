export interface CartLineItem {
  readonly productId: string;
  readonly productName: string;
  readonly quantity: number;
  readonly unitPrice: number;
}

export interface CartSnapshot {
  readonly items: readonly CartLineItem[];
  readonly subtotal: number;
}
