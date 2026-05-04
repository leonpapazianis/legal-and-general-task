import { Product } from '../../domain/product.entity';
import { IProductRepository } from '../../domain/product.repository.port';

export class ProductInMemoryRepository implements IProductRepository {
  private readonly store = new Map<string, Product>();

  findById(id: string): Product | undefined {
    return this.store.get(id);
  }

  findAll(): Product[] {
    return Array.from(this.store.values());
  }

  save(product: Product): Product {
    this.store.set(product.id, product);
    return product;
  }

  delete(id: string): void {
    this.store.delete(id);
  }
}
