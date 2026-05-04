import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductInMemoryRepository } from '../infrastructure/persistence/product.in-memory.repository';

const makeService = () => new ProductsService(new ProductInMemoryRepository());

const seed = (service: ProductsService, overrides: Partial<{ price: number; stock: number }> = {}) =>
  service.create({ name: 'Widget', description: 'A widget', price: 9.99, stock: 10, ...overrides });

describe('ProductsService', () => {
  describe('create', () => {
    it('returns a product with a generated id', () => {
      const svc = makeService();
      const p = seed(svc);
      expect(p.id).toBeDefined();
      expect(p.name).toBe('Widget');
    });

    it('the created product is retrievable', () => {
      const svc = makeService();
      const created = seed(svc);
      const found = svc.findById(created.id);
      expect(found.id).toBe(created.id);
    });
  });

  describe('findAll', () => {
    it('returns an empty array when no products exist', () => {
      const svc = makeService();
      expect(svc.findAll()).toHaveLength(0);
    });

    it('returns all created products', () => {
      const svc = makeService();
      seed(svc);
      seed(svc);
      expect(svc.findAll()).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('throws NotFoundException for an unknown id', () => {
      const svc = makeService();
      expect(() => svc.findById('unknown')).toThrow(NotFoundException);
    });

    it('includes availableStock in the response', () => {
      const svc = makeService();
      const p = seed(svc, { stock: 10 });
      expect(svc.findById(p.id).availableStock).toBe(10);
    });
  });

  describe('update', () => {
    it('updates the product name', () => {
      const svc = makeService();
      const p = seed(svc);
      const updated = svc.update(p.id, { name: 'Gadget' });
      expect(updated.name).toBe('Gadget');
    });

    it('throws NotFoundException for an unknown id', () => {
      const svc = makeService();
      expect(() => svc.update('unknown', { name: 'X' })).toThrow(NotFoundException);
    });

    it('rejects setting price to zero', () => {
      const svc = makeService();
      const p = seed(svc);
      expect(() => svc.update(p.id, { price: 0 })).toThrow(UnprocessableEntityException);
    });
  });

  describe('delete', () => {
    it('removes the product so it is no longer findable', () => {
      const svc = makeService();
      const p = seed(svc);
      svc.delete(p.id);
      expect(() => svc.findById(p.id)).toThrow(NotFoundException);
    });

    it('throws NotFoundException for an unknown id', () => {
      const svc = makeService();
      expect(() => svc.delete('unknown')).toThrow(NotFoundException);
    });
  });

  describe('reserve', () => {
    it('reduces available stock by the reserved quantity', () => {
      const svc = makeService();
      const p = seed(svc, { stock: 10 });
      svc.reserve(p.id, 3);
      expect(svc.findById(p.id).availableStock).toBe(7);
    });

    it('throws UnprocessableEntityException when stock is insufficient', () => {
      const svc = makeService();
      const p = seed(svc, { stock: 2 });
      expect(() => svc.reserve(p.id, 5)).toThrow(UnprocessableEntityException);
    });
  });

  describe('release', () => {
    it('restores available stock after a reservation is released', () => {
      const svc = makeService();
      const p = seed(svc, { stock: 10 });
      svc.reserve(p.id, 5);
      svc.release(p.id, 5);
      expect(svc.findById(p.id).availableStock).toBe(10);
    });
  });

  describe('commit', () => {
    it('permanently deducts stock and clears the reservation', () => {
      const svc = makeService();
      const p = seed(svc, { stock: 10 });
      svc.reserve(p.id, 3);
      svc.commit(p.id, 3);
      const after = svc.findById(p.id);
      expect(after.stock).toBe(7);
      expect(after.reserved).toBe(0);
    });
  });
});
