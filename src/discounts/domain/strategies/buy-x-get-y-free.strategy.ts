import { IDiscountStrategy } from './discount.strategy';
import { Discount, DiscountType, BuyXGetYFreeConfig } from '../discount.entity';
import { CartSnapshot } from '../cart-snapshot';
import { DiscountLineItem } from '../discount-result';

export class BuyXGetYFreeStrategy implements IDiscountStrategy {
  readonly type = DiscountType.BUY_X_GET_Y_FREE;
  readonly level = 'product' as const;

  apply(snapshot: CartSnapshot, discount: Discount): DiscountLineItem[] {
    const config = discount.config as BuyXGetYFreeConfig;
    const item = snapshot.items.find(i => i.productId === config.productId);
    if (!item) return [];

    const groupSize = config.buyQuantity + config.getFreeQuantity;
    const groups = Math.floor(item.quantity / groupSize);
    if (groups === 0) return [];

    const freeUnits = groups * config.getFreeQuantity;
    const amountOff = parseFloat((freeUnits * item.unitPrice).toFixed(2));

    return [{
      discountId: discount.id,
      discountName: discount.name,
      productId: config.productId,
      amountOff,
      description: `Buy ${config.buyQuantity} get ${config.getFreeQuantity} free on ${item.productName} (${freeUnits} free)`,
    }];
  }
}
