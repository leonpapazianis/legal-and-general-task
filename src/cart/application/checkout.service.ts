import { Injectable, ConflictException } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartStatus } from '../domain/cart.entity';
import { ProductsService } from '../../products/application/products.service';
import { DiscountsService } from '../../discounts/application/discounts.service';
import { DiscountEngineService } from '../../discounts/domain/discount-engine.service';
import { DiscountResult } from '../../discounts/domain/discount-result';

export interface CheckoutResult {
  cartId: string;
  subtotal: number;
  discounts: DiscountResult;
  total: number;
}

@Injectable()
export class CheckoutService {
  constructor(
    private readonly cartService: CartService,
    private readonly productsService: ProductsService,
    private readonly discountsService: DiscountsService,
    private readonly discountEngine: DiscountEngineService,
  ) {}

  checkout(cartId: string): CheckoutResult {
    const cart = this.cartService.getCart(cartId);
    if (cart.status !== CartStatus.ACTIVE) {
      throw new ConflictException('Cart is not active');
    }

    const activeDiscounts = this.discountsService.findAllActive();
    const discounts = this.discountEngine.calculate(cart.items, activeDiscounts);

    for (const item of cart.items) {
      this.productsService.commit(item.productId, item.quantity);
    }

    cart.markCheckedOut();
    this.cartService.persistCart(cart);

    return {
      cartId: cart.id,
      subtotal: discounts.subtotal,
      discounts,
      total: discounts.total,
    };
  }
}
