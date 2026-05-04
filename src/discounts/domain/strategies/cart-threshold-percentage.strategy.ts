import { IDiscountStrategy } from './discount.strategy';
import { Discount, DiscountType, CartThresholdPercentageConfig } from '../discount.entity';
import { CartSnapshot } from '../cart-snapshot';
import { DiscountLineItem } from '../discount-result';

export class CartThresholdPercentageStrategy implements IDiscountStrategy {
  readonly type = DiscountType.CART_THRESHOLD_PERCENTAGE;
  readonly level = 'cart' as const;

  apply(snapshot: CartSnapshot, discount: Discount): DiscountLineItem[] {
    const config = discount.config as CartThresholdPercentageConfig;
    if (snapshot.subtotal < config.thresholdAmount) return [];

    const amountOff = parseFloat(((snapshot.subtotal * config.percentage) / 100).toFixed(2));

    return [{
      discountId: discount.id,
      discountName: discount.name,
      productId: null,
      amountOff,
      description: `${config.percentage}% off orders over £${config.thresholdAmount}`,
    }];
  }
}
