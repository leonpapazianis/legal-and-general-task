import { Discount } from '../../domain/discount.entity';
import { IDiscountRepository } from '../../domain/discount.repository.port';

export class DiscountInMemoryRepository implements IDiscountRepository {
  private readonly store = new Map<string, Discount>();

  findById(id: string): Discount | undefined {
    return this.store.get(id);
  }

  findAll(): Discount[] {
    return Array.from(this.store.values());
  }

  findAllActive(): Discount[] {
    return this.findAll().filter(d => d.isActive);
  }

  save(discount: Discount): Discount {
    this.store.set(discount.id, discount);
    return discount;
  }

  delete(id: string): void {
    this.store.delete(id);
  }
}
