import { Injectable } from '@nestjs/common';
import { CartService } from './cart.service';

export const CART_TTL_MS = 120_000;

@Injectable()
export class CartExpiryService {
  constructor(private readonly cartService: CartService) {}

  sweep(ttlMs: number = CART_TTL_MS): void {
    const activeCarts = this.cartService.findActiveCarts();
    for (const cart of activeCarts) {
      if (cart.isExpired(ttlMs)) {
        this.cartService.expireCart(cart.id);
      }
    }
  }
}
