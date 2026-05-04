import { Discount } from './discount.entity';

export const DISCOUNT_REPOSITORY = Symbol('IDiscountRepository');

export interface IDiscountRepository {
  findById(id: string): Discount | undefined;
  findAll(): Discount[];
  findAllActive(): Discount[];
  save(discount: Discount): Discount;
  delete(id: string): void;
}
