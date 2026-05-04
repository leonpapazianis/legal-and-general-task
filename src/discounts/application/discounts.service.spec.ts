import { NotFoundException } from '@nestjs/common';
import { DiscountsService } from './discounts.service';
import { DiscountInMemoryRepository } from '../infrastructure/persistence/discount.in-memory.repository';
import { DiscountType } from '../domain/discount.entity';

const makeService = () => new DiscountsService(new DiscountInMemoryRepository());

const seedDiscount = (service: DiscountsService, overrides = {}) =>
  service.create({
    name: '10% off Widget',
    type: DiscountType.PERCENTAGE_OFF_PRODUCT,
    config: { productId: 'p1', percentage: 10 },
    isActive: true,
    ...overrides,
  });

describe('DiscountsService', () => {
  describe('create', () => {
    it('returns a discount with a generated id', () => {
      const svc = makeService();
      const d = seedDiscount(svc);
      expect(d.id).toBeDefined();
      expect(d.type).toBe(DiscountType.PERCENTAGE_OFF_PRODUCT);
      expect(d.isActive).toBe(true);
    });

    it('the created discount is retrievable', () => {
      const svc = makeService();
      const created = seedDiscount(svc);
      expect(svc.findById(created.id).id).toBe(created.id);
    });
  });

  describe('findAll', () => {
    it('returns empty array when no discounts exist', () => {
      expect(makeService().findAll()).toHaveLength(0);
    });

    it('returns all created discounts', () => {
      const svc = makeService();
      seedDiscount(svc);
      seedDiscount(svc);
      expect(svc.findAll()).toHaveLength(2);
    });
  });

  describe('findAllActive', () => {
    it('returns only active discounts', () => {
      const svc = makeService();
      seedDiscount(svc, { isActive: true });
      seedDiscount(svc, { isActive: false });
      expect(svc.findAllActive()).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('throws NotFoundException for unknown id', () => {
      expect(() => makeService().findById('unknown')).toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates name and isActive', () => {
      const svc = makeService();
      const d = seedDiscount(svc);
      const updated = svc.update(d.id, { name: 'New name', isActive: false });
      expect(updated.name).toBe('New name');
      expect(updated.isActive).toBe(false);
    });

    it('throws NotFoundException for unknown id', () => {
      expect(() => makeService().update('unknown', { name: 'X' })).toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('removes the discount so it is no longer findable', () => {
      const svc = makeService();
      const d = seedDiscount(svc);
      svc.delete(d.id);
      expect(() => svc.findById(d.id)).toThrow(NotFoundException);
    });

    it('throws NotFoundException for unknown id', () => {
      expect(() => makeService().delete('unknown')).toThrow(NotFoundException);
    });
  });
});
