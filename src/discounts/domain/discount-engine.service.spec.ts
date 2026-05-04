import { DiscountEngineService } from './discount-engine.service';
import { Discount, DiscountType } from './discount.entity';
import { PercentageOffProductStrategy } from './strategies/percentage-off-product.strategy';
import { FixedAmountOffProductStrategy } from './strategies/fixed-amount-off-product.strategy';
import { BuyXGetYFreeStrategy } from './strategies/buy-x-get-y-free.strategy';
import { CartThresholdPercentageStrategy } from './strategies/cart-threshold-percentage.strategy';
import { CartLineItem } from './cart-snapshot';

const allStrategies = [
  new PercentageOffProductStrategy(),
  new FixedAmountOffProductStrategy(),
  new BuyXGetYFreeStrategy(),
  new CartThresholdPercentageStrategy(),
];

const engine = () => new DiscountEngineService(allStrategies);

const item = (productId: string, quantity: number, unitPrice: number): CartLineItem => ({
  productId,
  productName: `Product ${productId}`,
  quantity,
  unitPrice,
});

const makeDiscount = (type: DiscountType, config: object, isActive = true) =>
  Discount.create({ name: 'Test', type, config: config as any, isActive });

describe('DiscountEngineService', () => {
  describe('with no discounts', () => {
    it('returns zero discount and correct subtotal', () => {
      const result = engine().calculate([item('p1', 2, 10)], []);
      expect(result.totalDiscount).toBe(0);
      expect(result.subtotal).toBe(20);
      expect(result.total).toBe(20);
      expect(result.lines).toHaveLength(0);
    });
  });

  describe('with inactive discounts', () => {
    it('skips inactive discounts', () => {
      const discount = makeDiscount(DiscountType.PERCENTAGE_OFF_PRODUCT, { productId: 'p1', percentage: 50 }, false);
      const result = engine().calculate([item('p1', 1, 100)], [discount]);
      expect(result.totalDiscount).toBe(0);
    });
  });

  describe('product-level discounts (pass 1)', () => {
    it('applies a single product-level discount', () => {
      const discount = makeDiscount(DiscountType.PERCENTAGE_OFF_PRODUCT, { productId: 'p1', percentage: 10 });
      const result = engine().calculate([item('p1', 1, 100)], [discount]);
      expect(result.totalDiscount).toBe(10);
      expect(result.total).toBe(90);
    });

    it('stacks multiple product-level discounts on the same product', () => {
      const pct = makeDiscount(DiscountType.PERCENTAGE_OFF_PRODUCT, { productId: 'p1', percentage: 10 });
      const fixed = makeDiscount(DiscountType.FIXED_AMOUNT_OFF_PRODUCT, { productId: 'p1', amountOff: 5 });
      const result = engine().calculate([item('p1', 1, 100)], [pct, fixed]);
      expect(result.totalDiscount).toBe(15); // 10 + 5
      expect(result.lines).toHaveLength(2);
    });

    it('does not apply product discount to non-matching products', () => {
      const discount = makeDiscount(DiscountType.PERCENTAGE_OFF_PRODUCT, { productId: 'p1', percentage: 50 });
      const result = engine().calculate([item('p2', 1, 100)], [discount]);
      expect(result.totalDiscount).toBe(0);
    });
  });

  describe('cart-level discounts (pass 2)', () => {
    it('applies cart threshold on the post-product-discount subtotal', () => {
      const productDiscount = makeDiscount(DiscountType.PERCENTAGE_OFF_PRODUCT, { productId: 'p1', percentage: 50 });
      const cartDiscount = makeDiscount(DiscountType.CART_THRESHOLD_PERCENTAGE, { thresholdAmount: 60, percentage: 10 });
      // subtotal = 100, after product discount = 50 → below 60 threshold, so cart discount should NOT apply
      const result = engine().calculate([item('p1', 1, 100)], [productDiscount, cartDiscount]);
      expect(result.lines).toHaveLength(1); // only product discount line
      expect(result.totalDiscount).toBe(50);
    });

    it('selects only the best cart-level discount when multiple qualify', () => {
      const small = makeDiscount(DiscountType.CART_THRESHOLD_PERCENTAGE, { thresholdAmount: 50, percentage: 5 });
      const large = makeDiscount(DiscountType.CART_THRESHOLD_PERCENTAGE, { thresholdAmount: 50, percentage: 20 });
      const result = engine().calculate([item('p1', 1, 100)], [small, large]);
      expect(result.lines).toHaveLength(1);
      expect(result.lines[0].amountOff).toBe(20); // best discount wins
    });

    it('does not apply cart discount when subtotal is below threshold', () => {
      const cartDiscount = makeDiscount(DiscountType.CART_THRESHOLD_PERCENTAGE, { thresholdAmount: 200, percentage: 10 });
      const result = engine().calculate([item('p1', 1, 100)], [cartDiscount]);
      expect(result.totalDiscount).toBe(0);
    });
  });

  describe('combined passes', () => {
    it('returns correct totals when both passes apply', () => {
      const productDiscount = makeDiscount(DiscountType.PERCENTAGE_OFF_PRODUCT, { productId: 'p1', percentage: 10 });
      const cartDiscount = makeDiscount(DiscountType.CART_THRESHOLD_PERCENTAGE, { thresholdAmount: 80, percentage: 10 });
      // subtotal = 100; product discount = 10; post-pass-1 = 90; 90 >= 80 → cart discount = 9
      const result = engine().calculate([item('p1', 1, 100)], [productDiscount, cartDiscount]);
      expect(result.lines).toHaveLength(2);
      expect(result.totalDiscount).toBe(19); // 10 + 9
      expect(result.total).toBe(81);
    });
  });
});
