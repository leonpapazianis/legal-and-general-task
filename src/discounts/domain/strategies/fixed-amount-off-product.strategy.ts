import { IDiscountStrategy } from './discount.strategy';
import { Discount, DiscountType, FixedAmountOffProductConfig } from '../discount.entity';
import { CartSnapshot } from '../cart-snapshot';
import { DiscountLineItem } from '../discount-result';

export class FixedAmountOffProductStrategy implements IDiscountStrategy {
  readonly type = DiscountType.FIXED_AMOUNT_OFF_PRODUCT;
  readonly level = 'product' as const;

  apply(snapshot: CartSnapshot, discount: Discount): DiscountLineItem[] {
    const config = discount.config as FixedAmountOffProductConfig;
    const item = snapshot.items.find((i) => i.productId === config.productId);
    if (!item) return [];

    const lineTotal = item.quantity * item.unitPrice;
    const rawAmountOff = config.amountOff * item.quantity;
    const amountOff = parseFloat(Math.min(rawAmountOff, lineTotal).toFixed(2));

    return [
      {
        discountId: discount.id,
        discountName: discount.name,
        productId: config.productId,
        amountOff,
        description: `£${config.amountOff} off each ${item.productName}`,
      },
    ];
  }
}
