import { Product } from './product.entity';

export const PRODUCT_REPOSITORY = Symbol('IProductRepository');

export interface IProductRepository {
  findById(id: string): Product | undefined;
  findAll(): Product[];
  save(product: Product): Product;
  delete(id: string): void;
}
