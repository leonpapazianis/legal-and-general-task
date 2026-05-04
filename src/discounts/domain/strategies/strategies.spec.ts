import { Discount, DiscountType } from '../discount.entity';
import { CartSnapshot } from '../cart-snapshot';
import { PercentageOffProductStrategy } from './percentage-off-product.strategy';
import { FixedAmountOffProductStrategy } from './fixed-amount-off-product.strategy';
import { BuyXGetYFreeStrategy } from './buy-x-get-y-free.strategy';
import { CartThresholdPercentageStrategy } from './cart-threshold-percentage.strategy';

const item = (productId: string, quantity: number, unitPrice: number) => ({
  productId,
  productName: `Product ${productId}`,
  quantity,
  unitPrice,
});

const snapshot = (items: ReturnType<typeof item>[]): CartSnapshot => ({
  items,
  subtotal: items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0),
});

const makeDiscount = (type: DiscountType, config: object) =>
  Discount.create({ name: 'Test discount', type, config: config as any });

describe('PercentageOffProductStrategy', () => {
  const strategy = new PercentageOffProductStrategy();

  it('applies percentage to matching product line total', () => {
    const discount = makeDiscount(DiscountType.PERCENTAGE_OFF_PRODUCT, { productId: 'p1', percentage: 20 });
    const lines = strategy.apply(snapshot([item('p1', 2, 10)]), discount);
    expect(lines).toHaveLength(1);
    expect(lines[0].amountOff).toBe(4); // 20% of (2 * 10) = 4
    expect(lines[0].productId).toBe('p1');
  });

  it('returns empty array when cart contains no matching product', () => {
    const discount = makeDiscount(DiscountType.PERCENTAGE_OFF_PRODUCT, { productId: 'p1', percentage: 20 });
    const lines = strategy.apply(snapshot([item('p2', 1, 10)]), discount);
    expect(lines).toHaveLength(0);
  });

  it('only applies to the matching product when multiple products are in cart', () => {
    const discount = makeDiscount(DiscountType.PERCENTAGE_OFF_PRODUCT, { productId: 'p1', percentage: 50 });
    const lines = strategy.apply(snapshot([item('p1', 2, 10), item('p2', 3, 5)]), discount);
    expect(lines).toHaveLength(1);
    expect(lines[0].amountOff).toBe(10); // 50% of 20
  });

  it('level is product', () => {
    expect(strategy.level).toBe('product');
  });
});

describe('FixedAmountOffProductStrategy', () => {
  const strategy = new FixedAmountOffProductStrategy();

  it('applies fixed amount off per unit of matching product', () => {
    const discount = makeDiscount(DiscountType.FIXED_AMOUNT_OFF_PRODUCT, { productId: 'p1', amountOff: 3 });
    const lines = strategy.apply(snapshot([item('p1', 4, 10)]), discount);
    expect(lines[0].amountOff).toBe(12); // 3 * 4 units
  });

  it('caps discount so line total does not go negative', () => {
    const discount = makeDiscount(DiscountType.FIXED_AMOUNT_OFF_PRODUCT, { productId: 'p1', amountOff: 20 });
    const lines = strategy.apply(snapshot([item('p1', 1, 5)]), discount); // line total = 5, amountOff would be 20
    expect(lines[0].amountOff).toBe(5); // capped at line total
  });

  it('returns empty array for non-matching product', () => {
    const discount = makeDiscount(DiscountType.FIXED_AMOUNT_OFF_PRODUCT, { productId: 'p1', amountOff: 5 });
    const lines = strategy.apply(snapshot([item('p2', 1, 10)]), discount);
    expect(lines).toHaveLength(0);
  });

  it('level is product', () => {
    expect(strategy.level).toBe('product');
  });
});

describe('BuyXGetYFreeStrategy', () => {
  const strategy = new BuyXGetYFreeStrategy();

  it('gives correct free items for one qualifying group', () => {
    // buy 2 get 1 free, cart has 3 units → 1 free
    const discount = makeDiscount(DiscountType.BUY_X_GET_Y_FREE, { productId: 'p1', buyQuantity: 2, getFreeQuantity: 1 });
    const lines = strategy.apply(snapshot([item('p1', 3, 10)]), discount);
    expect(lines[0].amountOff).toBe(10); // 1 free unit at £10
  });

  it('gives correct free items for multiple qualifying groups', () => {
    // buy 2 get 1 free, cart has 6 units → 2 free
    const discount = makeDiscount(DiscountType.BUY_X_GET_Y_FREE, { productId: 'p1', buyQuantity: 2, getFreeQuantity: 1 });
    const lines = strategy.apply(snapshot([item('p1', 6, 10)]), discount);
    expect(lines[0].amountOff).toBe(20); // 2 free units at £10
  });

  it('gives no discount when quantity is below threshold', () => {
    // buy 2 get 1 free, cart has only 2 units — need 3 to qualify
    const discount = makeDiscount(DiscountType.BUY_X_GET_Y_FREE, { productId: 'p1', buyQuantity: 2, getFreeQuantity: 1 });
    const lines = strategy.apply(snapshot([item('p1', 2, 10)]), discount);
    expect(lines).toHaveLength(0);
  });

  it('returns empty array for non-matching product', () => {
    const discount = makeDiscount(DiscountType.BUY_X_GET_Y_FREE, { productId: 'p1', buyQuantity: 2, getFreeQuantity: 1 });
    const lines = strategy.apply(snapshot([item('p2', 6, 10)]), discount);
    expect(lines).toHaveLength(0);
  });

  it('level is product', () => {
    expect(strategy.level).toBe('product');
  });
});

describe('CartThresholdPercentageStrategy', () => {
  const strategy = new CartThresholdPercentageStrategy();

  it('applies percentage discount when subtotal meets threshold', () => {
    const discount = makeDiscount(DiscountType.CART_THRESHOLD_PERCENTAGE, { thresholdAmount: 100, percentage: 10 });
    const lines = strategy.apply(snapshot([item('p1', 1, 120)]), discount);
    expect(lines[0].amountOff).toBe(12); // 10% of 120
    expect(lines[0].productId).toBeNull();
  });

  it('applies when subtotal exactly equals threshold', () => {
    const discount = makeDiscount(DiscountType.CART_THRESHOLD_PERCENTAGE, { thresholdAmount: 100, percentage: 10 });
    const lines = strategy.apply(snapshot([item('p1', 1, 100)]), discount);
    expect(lines[0].amountOff).toBe(10);
  });

  it('does not apply when subtotal is below threshold', () => {
    const discount = makeDiscount(DiscountType.CART_THRESHOLD_PERCENTAGE, { thresholdAmount: 100, percentage: 10 });
    const lines = strategy.apply(snapshot([item('p1', 1, 99)]), discount);
    expect(lines).toHaveLength(0);
  });

  it('level is cart', () => {
    expect(strategy.level).toBe('cart');
  });
});
