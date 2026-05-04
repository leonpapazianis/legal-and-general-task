import { Discount, DiscountType } from './discount.entity';
import { DomainError } from '../../shared/domain/domain.error';

describe('Discount', () => {
  describe('PERCENTAGE_OFF_PRODUCT', () => {
    const validConfig = { productId: 'p1', percentage: 20 };

    it('creates a valid percentage-off-product discount', () => {
      const d = Discount.create({
        name: '20% off Widget',
        type: DiscountType.PERCENTAGE_OFF_PRODUCT,
        config: validConfig,
      });
      expect(d.id).toBeDefined();
      expect(d.isActive).toBe(true);
      expect(d.type).toBe(DiscountType.PERCENTAGE_OFF_PRODUCT);
    });

    it('rejects percentage of zero', () => {
      expect(() =>
        Discount.create({ name: 'bad', type: DiscountType.PERCENTAGE_OFF_PRODUCT, config: { productId: 'p1', percentage: 0 } }),
      ).toThrow(DomainError);
    });

    it('rejects percentage above 100', () => {
      expect(() =>
        Discount.create({ name: 'bad', type: DiscountType.PERCENTAGE_OFF_PRODUCT, config: { productId: 'p1', percentage: 101 } }),
      ).toThrow(DomainError);
    });

    it('rejects missing productId', () => {
      expect(() =>
        Discount.create({ name: 'bad', type: DiscountType.PERCENTAGE_OFF_PRODUCT, config: { productId: '', percentage: 10 } }),
      ).toThrow(DomainError);
    });
  });

  describe('FIXED_AMOUNT_OFF_PRODUCT', () => {
    it('creates a valid fixed-amount-off discount', () => {
      const d = Discount.create({
        name: '£5 off Widget',
        type: DiscountType.FIXED_AMOUNT_OFF_PRODUCT,
        config: { productId: 'p1', amountOff: 5 },
      });
      expect(d.type).toBe(DiscountType.FIXED_AMOUNT_OFF_PRODUCT);
    });

    it('rejects amountOff of zero', () => {
      expect(() =>
        Discount.create({ name: 'bad', type: DiscountType.FIXED_AMOUNT_OFF_PRODUCT, config: { productId: 'p1', amountOff: 0 } }),
      ).toThrow(DomainError);
    });

    it('rejects negative amountOff', () => {
      expect(() =>
        Discount.create({ name: 'bad', type: DiscountType.FIXED_AMOUNT_OFF_PRODUCT, config: { productId: 'p1', amountOff: -5 } }),
      ).toThrow(DomainError);
    });
  });

  describe('BUY_X_GET_Y_FREE', () => {
    it('creates a valid buy-x-get-y-free discount', () => {
      const d = Discount.create({
        name: 'Buy 2 get 1 free',
        type: DiscountType.BUY_X_GET_Y_FREE,
        config: { productId: 'p1', buyQuantity: 2, getFreeQuantity: 1 },
      });
      expect(d.type).toBe(DiscountType.BUY_X_GET_Y_FREE);
    });

    it('rejects buyQuantity less than 1', () => {
      expect(() =>
        Discount.create({ name: 'bad', type: DiscountType.BUY_X_GET_Y_FREE, config: { productId: 'p1', buyQuantity: 0, getFreeQuantity: 1 } }),
      ).toThrow(DomainError);
    });

    it('rejects getFreeQuantity less than 1', () => {
      expect(() =>
        Discount.create({ name: 'bad', type: DiscountType.BUY_X_GET_Y_FREE, config: { productId: 'p1', buyQuantity: 2, getFreeQuantity: 0 } }),
      ).toThrow(DomainError);
    });
  });

  describe('CART_THRESHOLD_PERCENTAGE', () => {
    it('creates a valid cart threshold discount', () => {
      const d = Discount.create({
        name: '10% off over £100',
        type: DiscountType.CART_THRESHOLD_PERCENTAGE,
        config: { thresholdAmount: 100, percentage: 10 },
      });
      expect(d.type).toBe(DiscountType.CART_THRESHOLD_PERCENTAGE);
    });

    it('rejects thresholdAmount of zero', () => {
      expect(() =>
        Discount.create({ name: 'bad', type: DiscountType.CART_THRESHOLD_PERCENTAGE, config: { thresholdAmount: 0, percentage: 10 } }),
      ).toThrow(DomainError);
    });

    it('rejects percentage of zero', () => {
      expect(() =>
        Discount.create({ name: 'bad', type: DiscountType.CART_THRESHOLD_PERCENTAGE, config: { thresholdAmount: 100, percentage: 0 } }),
      ).toThrow(DomainError);
    });
  });

  describe('activate / deactivate', () => {
    it('can be deactivated then reactivated', () => {
      const d = Discount.create({
        name: 'Sale',
        type: DiscountType.PERCENTAGE_OFF_PRODUCT,
        config: { productId: 'p1', percentage: 10 },
      });
      d.deactivate();
      expect(d.isActive).toBe(false);
      d.activate();
      expect(d.isActive).toBe(true);
    });
  });

  describe('update', () => {
    it('updates the name', () => {
      const d = Discount.create({
        name: 'Old name',
        type: DiscountType.PERCENTAGE_OFF_PRODUCT,
        config: { productId: 'p1', percentage: 10 },
      });
      d.update({ name: 'New name' });
      expect(d.name).toBe('New name');
    });
  });
});
