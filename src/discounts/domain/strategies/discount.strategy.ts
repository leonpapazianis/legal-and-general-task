import { Discount, DiscountType } from '../discount.entity';
import { CartSnapshot } from '../cart-snapshot';
import { DiscountLineItem } from '../discount-result';

export interface IDiscountStrategy {
  readonly type: DiscountType;
  readonly level: 'product' | 'cart';
  apply(snapshot: CartSnapshot, discount: Discount): DiscountLineItem[];
}
