import { Cart, CartStatus } from './cart.entity';
import { DomainError } from '../../shared/domain/domain.error';

const makeCart = () => Cart.create();

describe('Cart', () => {
  describe('create', () => {
    it('creates an ACTIVE cart with a generated id and no items', () => {
      const cart = makeCart();
      expect(cart.id).toBeDefined();
      expect(cart.status).toBe(CartStatus.ACTIVE);
      expect(cart.items).toHaveLength(0);
    });
  });

  describe('addItem', () => {
    it('adds a new item to an empty cart', () => {
      const cart = makeCart();
      cart.addItem('p1', 'Widget', 2, 10);
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.items[0].unitPrice).toBe(10);
    });

    it('merges quantity when same product is added again', () => {
      const cart = makeCart();
      cart.addItem('p1', 'Widget', 2, 10);
      cart.addItem('p1', 'Widget', 3, 10);
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(5);
    });

    it('updates lastActivityAt', () => {
      const cart = makeCart();
      const before = cart.lastActivityAt;
      cart.addItem('p1', 'Widget', 1, 10);
      expect(cart.lastActivityAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('throws when cart is CHECKED_OUT', () => {
      const cart = makeCart();
      cart.addItem('p1', 'Widget', 1, 10);
      cart.markCheckedOut();
      expect(() => cart.addItem('p2', 'Gadget', 1, 5)).toThrow(DomainError);
    });

    it('throws when cart is EXPIRED', () => {
      const cart = makeCart();
      cart.markExpired();
      expect(() => cart.addItem('p1', 'Widget', 1, 10)).toThrow(DomainError);
    });

    it('throws InvariantViolationError when quantity is zero', () => {
      const cart = makeCart();
      expect(() => cart.addItem('p1', 'Widget', 0, 10)).toThrow(DomainError);
    });

    it('throws InvariantViolationError when quantity is negative', () => {
      const cart = makeCart();
      expect(() => cart.addItem('p1', 'Widget', -1, 10)).toThrow(DomainError);
    });
  });

  describe('updateItemQuantity', () => {
    it('returns the quantity delta', () => {
      const cart = makeCart();
      cart.addItem('p1', 'Widget', 2, 10);
      const delta = cart.updateItemQuantity('p1', 5);
      expect(delta).toBe(3); // 5 - 2
      expect(cart.items[0].quantity).toBe(5);
    });

    it('returns a negative delta when quantity is decreased', () => {
      const cart = makeCart();
      cart.addItem('p1', 'Widget', 5, 10);
      const delta = cart.updateItemQuantity('p1', 2);
      expect(delta).toBe(-3);
      expect(cart.items[0].quantity).toBe(2);
    });

    it('removes the item when quantity is set to zero', () => {
      const cart = makeCart();
      cart.addItem('p1', 'Widget', 3, 10);
      cart.updateItemQuantity('p1', 0);
      expect(cart.items).toHaveLength(0);
    });

    it('throws when product is not in cart', () => {
      const cart = makeCart();
      expect(() => cart.updateItemQuantity('unknown', 1)).toThrow(DomainError);
    });
  });

  describe('removeItem', () => {
    it('removes the item and returns the removed quantity', () => {
      const cart = makeCart();
      cart.addItem('p1', 'Widget', 3, 10);
      const qty = cart.removeItem('p1');
      expect(qty).toBe(3);
      expect(cart.items).toHaveLength(0);
    });

    it('throws when product is not in cart', () => {
      const cart = makeCart();
      expect(() => cart.removeItem('unknown')).toThrow(DomainError);
    });
  });

  describe('subtotal', () => {
    it('returns 0 for empty cart', () => {
      expect(makeCart().subtotal).toBe(0);
    });

    it('returns sum of quantity * unitPrice across all items', () => {
      const cart = makeCart();
      cart.addItem('p1', 'Widget', 2, 10);
      cart.addItem('p2', 'Gadget', 3, 5);
      expect(cart.subtotal).toBe(35);
    });
  });

  describe('isExpired', () => {
    it('returns false when lastActivityAt is within the TTL', () => {
      const cart = makeCart();
      expect(cart.isExpired(120_000)).toBe(false);
    });

    it('returns true when lastActivityAt is beyond the TTL', () => {
      const cart = makeCart();
      cart.lastActivityAt = new Date(Date.now() - 121_000);
      expect(cart.isExpired(120_000)).toBe(true);
    });
  });

  describe('status transitions', () => {
    it('markCheckedOut sets status to CHECKED_OUT', () => {
      const cart = makeCart();
      cart.markCheckedOut();
      expect(cart.status).toBe(CartStatus.CHECKED_OUT);
    });

    it('markExpired sets status to EXPIRED', () => {
      const cart = makeCart();
      cart.markExpired();
      expect(cart.status).toBe(CartStatus.EXPIRED);
    });
  });
});
