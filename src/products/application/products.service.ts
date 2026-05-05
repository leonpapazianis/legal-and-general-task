import { Injectable, Inject } from '@nestjs/common';
import { Product, CreateProductProps, UpdateProductProps } from '../domain/product.entity';
import type { IProductRepository } from '../domain/product.repository.port';
import { PRODUCT_REPOSITORY } from '../domain/product.repository.port';
import { EntityNotFoundError } from '../../shared/domain/domain.error';

@Injectable()
export class ProductsService {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly repo: IProductRepository) {}

  create(props: CreateProductProps): Product {
    const product = Product.create(props);
    return this.repo.save(product);
  }

  findAll(): Product[] {
    return this.repo.findAll();
  }

  findById(id: string): Product {
    const product = this.repo.findById(id);
    if (!product) throw new EntityNotFoundError(`Product '${id}' not found`);
    return product;
  }

  update(id: string, props: UpdateProductProps): Product {
    const product = this.findById(id);
    product.update(props);
    return this.repo.save(product);
  }

  delete(id: string): void {
    this.findById(id);
    this.repo.delete(id);
  }

  reserve(id: string, quantity: number): void {
    const product = this.findById(id);
    product.reserve(quantity);
    this.repo.save(product);
  }

  release(id: string, quantity: number): void {
    const product = this.findById(id);
    product.release(quantity);
    this.repo.save(product);
  }

  commit(id: string, quantity: number): void {
    const product = this.findById(id);
    product.commit(quantity);
    this.repo.save(product);
  }
}
