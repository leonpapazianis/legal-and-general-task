import { IDiscountStrategy } from './discount.strategy';
import { Discount, DiscountType, PercentageOffProductConfig } from '../discount.entity';
import { CartSnapshot } from '../cart-snapshot';
import { DiscountLineItem } from '../discount-result';

export class PercentageOffProductStrategy implements IDiscountStrategy {
  readonly type = DiscountType.PERCENTAGE_OFF_PRODUCT;
  readonly level = 'product' as const;

  apply(snapshot: CartSnapshot, discount: Discount): DiscountLineItem[] {
    const config = discount.config as PercentageOffProductConfig;
    const item = snapshot.items.find((i) => i.productId === config.productId);
    if (!item) return [];

    const lineTotal = item.quantity * item.unitPrice;
    const amountOff = parseFloat(((lineTotal * config.percentage) / 100).toFixed(2));

    return [
      {
        discountId: discount.id,
        discountName: discount.name,
        productId: config.productId,
        amountOff,
        description: `${config.percentage}% off ${item.productName}`,
      },
    ];
  }
}
