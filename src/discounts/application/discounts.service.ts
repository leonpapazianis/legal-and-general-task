import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Discount, CreateDiscountProps, UpdateDiscountProps } from '../domain/discount.entity';
import type { IDiscountRepository } from '../domain/discount.repository.port';
import { DISCOUNT_REPOSITORY } from '../domain/discount.repository.port';

@Injectable()
export class DiscountsService {
  constructor(@Inject(DISCOUNT_REPOSITORY) private readonly repo: IDiscountRepository) {}

  create(props: CreateDiscountProps): Discount {
    const discount = Discount.create(props);
    return this.repo.save(discount);
  }

  findAll(): Discount[] {
    return this.repo.findAll();
  }

  findAllActive(): Discount[] {
    return this.repo.findAllActive();
  }

  findById(id: string): Discount {
    const discount = this.repo.findById(id);
    if (!discount) throw new NotFoundException(`Discount '${id}' not found`);
    return discount;
  }

  update(id: string, props: UpdateDiscountProps): Discount {
    const discount = this.findById(id);
    discount.update(props);
    return this.repo.save(discount);
  }

  delete(id: string): void {
    this.findById(id);
    this.repo.delete(id);
  }
}
