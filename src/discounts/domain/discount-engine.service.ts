import { Injectable, Inject } from '@nestjs/common';
import { Discount, DiscountType } from './discount.entity';
import { CartLineItem, CartSnapshot } from './cart-snapshot';
import { DiscountLineItem, DiscountResult } from './discount-result';
import { IDiscountStrategy } from './strategies/discount.strategy';

export const DISCOUNT_STRATEGIES = 'DISCOUNT_STRATEGIES';

@Injectable()
export class DiscountEngineService {
  private readonly strategies: Map<DiscountType, IDiscountStrategy>;

  constructor(@Inject(DISCOUNT_STRATEGIES) strategies: IDiscountStrategy[]) {
    this.strategies = new Map(strategies.map(s => [s.type, s]));
  }

  calculate(items: CartLineItem[], discounts: Discount[]): DiscountResult {
    const activeDiscounts = discounts.filter(d => d.isActive);
    const subtotal = parseFloat(items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0).toFixed(2));

    // Pass 1: product-level discounts
    const productLines: DiscountLineItem[] = [];
    const productDiscounts = activeDiscounts.filter(d => {
      const strategy = this.strategies.get(d.type);
      return strategy?.level === 'product';
    });

    for (const discount of productDiscounts) {
      const strategy = this.strategies.get(discount.type);
      if (!strategy) continue;
      const snapshot: CartSnapshot = { items, subtotal };
      const lines = strategy.apply(snapshot, discount);
      productLines.push(...lines);
    }

    const productLevelDiscount = parseFloat(productLines.reduce((sum, l) => sum + l.amountOff, 0).toFixed(2));
    const postPassOneSubtotal = parseFloat((subtotal - productLevelDiscount).toFixed(2));

    // Pass 2: cart-level discounts — apply to post-pass-1 subtotal, take the best only
    const cartDiscounts = activeDiscounts.filter(d => {
      const strategy = this.strategies.get(d.type);
      return strategy?.level === 'cart';
    });

    let bestCartLine: DiscountLineItem | null = null;
    for (const discount of cartDiscounts) {
      const strategy = this.strategies.get(discount.type);
      if (!strategy) continue;
      const snapshot: CartSnapshot = { items, subtotal: postPassOneSubtotal };
      const lines = strategy.apply(snapshot, discount);
      if (lines.length > 0 && (!bestCartLine || lines[0].amountOff > bestCartLine.amountOff)) {
        bestCartLine = lines[0];
      }
    }

    const allLines = bestCartLine ? [...productLines, bestCartLine] : productLines;
    const totalDiscount = parseFloat(allLines.reduce((sum, l) => sum + l.amountOff, 0).toFixed(2));
    const total = parseFloat((subtotal - totalDiscount).toFixed(2));

    return { lines: allLines, totalDiscount, subtotal, total };
  }
}
