import { Injectable } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartStatus, CartItem } from '../domain/cart.entity';
import { CartNotActiveError, InvariantViolationError } from '../../shared/domain/domain.error';
import { ProductsService } from '../../products/application/products.service';
import { DiscountsService } from '../../discounts/application/discounts.service';
import { DiscountEngineService } from '../../discounts/domain/discount-engine.service';
import { DiscountResult } from '../../discounts/domain/discount-result';

export interface CheckoutLineItem extends CartItem {
  lineTotal: number;
}

export interface CheckoutResult {
  cartId: string;
  items: CheckoutLineItem[];
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
      throw new CartNotActiveError('Cart is not active');
    }
    if (cart.items.length === 0) {
      throw new InvariantViolationError('Cannot checkout an empty cart');
    }

    const activeDiscounts = this.discountsService.findAllActive();
    const discounts = this.discountEngine.calculate(cart.items, activeDiscounts);

    const committed: Array<{ productId: string; quantity: number }> = [];
    try {
      for (const item of cart.items) {
        this.productsService.commit(item.productId, item.quantity);
        committed.push({ productId: item.productId, quantity: item.quantity });
      }
    } catch (err) {
      for (const { productId, quantity } of committed) {
        try {
          this.productsService.uncommit(productId, quantity);
        } catch {
          // best-effort: ignore rollback failures
        }
      }
      throw err;
    }

    cart.markCheckedOut();
    this.cartService.persistCart(cart);

    return {
      cartId: cart.id,
      items: cart.items.map((item) => ({
        ...item,
        lineTotal: parseFloat((item.quantity * item.unitPrice).toFixed(2)),
      })),
      subtotal: discounts.subtotal,
      discounts,
      total: discounts.total,
    };
  }
}
