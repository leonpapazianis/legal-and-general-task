import { Product } from './product.entity';
import { InvariantViolationError, StockUnavailableError } from '../../shared/domain/domain.error';

const makeProduct = (overrides: Partial<{ price: number; stock: number }> = {}) =>
  Product.create({ name: 'Widget', description: 'A widget', price: 9.99, stock: 10, ...overrides });

describe('Product', () => {
  describe('create', () => {
    it('builds a product with the given fields', () => {
      const p = makeProduct();
      expect(p.name).toBe('Widget');
      expect(p.price).toBe(9.99);
      expect(p.stock).toBe(10);
      expect(p.reserved).toBe(0);
      expect(p.id).toBeDefined();
    });

    it('rejects a negative price', () => {
      expect(() => makeProduct({ price: -1 })).toThrow(InvariantViolationError);
    });

    it('rejects a zero price', () => {
      expect(() => makeProduct({ price: 0 })).toThrow(InvariantViolationError);
    });

    it('rejects negative stock', () => {
      expect(() => makeProduct({ stock: -1 })).toThrow(InvariantViolationError);
    });

    it('allows zero stock', () => {
      expect(() => makeProduct({ stock: 0 })).not.toThrow();
    });
  });

  describe('availableStock', () => {
    it('returns stock minus reserved', () => {
      const p = makeProduct({ stock: 10 });
      p.reserve(3);
      expect(p.availableStock).toBe(7);
    });
  });

  describe('reserve', () => {
    it('increases reserved by the given quantity', () => {
      const p = makeProduct({ stock: 10 });
      p.reserve(4);
      expect(p.reserved).toBe(4);
    });

    it('throws StockUnavailableError when requested quantity exceeds available stock', () => {
      const p = makeProduct({ stock: 5 });
      expect(() => p.reserve(6)).toThrow(StockUnavailableError);
    });

    it('allows reserving exactly the available stock', () => {
      const p = makeProduct({ stock: 5 });
      p.reserve(5);
      expect(p.reserved).toBe(5);
    });
  });

  describe('release', () => {
    it('decreases reserved by the given quantity', () => {
      const p = makeProduct({ stock: 10 });
      p.reserve(6);
      p.release(2);
      expect(p.reserved).toBe(4);
    });

    it('throws InvariantViolationError when releasing more than reserved', () => {
      const p = makeProduct({ stock: 10 });
      p.reserve(3);
      expect(() => p.release(4)).toThrow(InvariantViolationError);
    });
  });

  describe('commit', () => {
    it('decrements both stock and reserved', () => {
      const p = makeProduct({ stock: 10 });
      p.reserve(3);
      p.commit(3);
      expect(p.stock).toBe(7);
      expect(p.reserved).toBe(0);
    });

    it('throws InvariantViolationError when committing more than reserved', () => {
      const p = makeProduct({ stock: 10 });
      p.reserve(2);
      expect(() => p.commit(3)).toThrow(InvariantViolationError);
    });
  });

  describe('update', () => {
    it('merges provided fields without touching others', () => {
      const p = makeProduct();
      p.update({ name: 'Gadget', price: 19.99 });
      expect(p.name).toBe('Gadget');
      expect(p.price).toBe(19.99);
      expect(p.description).toBe('A widget');
    });

    it('throws InvariantViolationError when updating price to zero', () => {
      const p = makeProduct();
      expect(() => p.update({ price: 0 })).toThrow(InvariantViolationError);
    });

    it('throws InvariantViolationError when updating stock below the currently reserved quantity', () => {
      const p = makeProduct({ stock: 10 });
      p.reserve(7);
      expect(() => p.update({ stock: 5 })).toThrow(InvariantViolationError);
    });

    it('allows updating stock to exactly the reserved quantity', () => {
      const p = makeProduct({ stock: 10 });
      p.reserve(5);
      expect(() => p.update({ stock: 5 })).not.toThrow();
      expect(p.availableStock).toBe(0);
    });
  });
});
