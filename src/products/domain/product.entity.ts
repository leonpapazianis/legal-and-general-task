import { randomUUID } from 'crypto';
import { InvariantViolationError, StockUnavailableError } from '../../shared/domain/domain.error';

export interface CreateProductProps {
  name: string;
  description: string;
  price: number;
  stock: number;
}

export interface UpdateProductProps {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
}

export class Product {
  readonly id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  reserved: number;
  readonly createdAt: Date;
  updatedAt: Date;

  private constructor(id: string, props: CreateProductProps) {
    this.id = id;
    this.name = props.name;
    this.description = props.description;
    this.price = props.price;
    this.stock = props.stock;
    this.reserved = 0;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  static create(props: CreateProductProps): Product {
    if (props.price <= 0)
      throw new InvariantViolationError('Product price must be greater than zero');
    if (props.stock < 0) throw new InvariantViolationError('Product stock cannot be negative');
    return new Product(randomUUID(), props);
  }

  get availableStock(): number {
    return this.stock - this.reserved;
  }

  reserve(quantity: number): void {
    if (quantity > this.availableStock) {
      throw new StockUnavailableError(
        `Insufficient stock: requested ${quantity}, available ${this.availableStock}`,
      );
    }
    this.reserved += quantity;
  }

  release(quantity: number): void {
    if (quantity > this.reserved) {
      throw new InvariantViolationError(
        `Cannot release ${quantity} units — only ${this.reserved} are reserved`,
      );
    }
    this.reserved -= quantity;
  }

  commit(quantity: number): void {
    if (quantity > this.reserved) {
      throw new InvariantViolationError(
        `Cannot commit ${quantity} units — only ${this.reserved} are reserved`,
      );
    }
    this.stock -= quantity;
    this.reserved -= quantity;
    this.updatedAt = new Date();
  }

  update(props: UpdateProductProps): void {
    if (props.price !== undefined && props.price <= 0) {
      throw new InvariantViolationError('Product price must be greater than zero');
    }
    if (props.name !== undefined) this.name = props.name;
    if (props.description !== undefined) this.description = props.description;
    if (props.price !== undefined) this.price = props.price;
    if (props.stock !== undefined) this.stock = props.stock;
    this.updatedAt = new Date();
  }

  clone(): Product {
    return Object.assign(Object.create(Product.prototype) as Product, {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      stock: this.stock,
      reserved: this.reserved,
      createdAt: new Date(this.createdAt),
      updatedAt: new Date(this.updatedAt),
    });
  }
}
