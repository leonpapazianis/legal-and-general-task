import { Injectable, Inject } from '@nestjs/common';
import { CartService } from './cart.service';
import type { ICartRepository } from '../domain/cart.repository.port';
import { CART_REPOSITORY } from '../domain/cart.repository.port';
import { CartStatus } from '../domain/cart.entity';

export const CART_TTL_MS = 120_000;

@Injectable()
export class CartExpiryService {
  constructor(
    private readonly cartService: CartService,
    @Inject(CART_REPOSITORY) private readonly cartRepo: ICartRepository,
  ) {}

  sweep(ttlMs: number = CART_TTL_MS): void {
    const activeCarts = this.cartRepo.findByStatus(CartStatus.ACTIVE);
    for (const cart of activeCarts) {
      if (cart.isExpired(ttlMs)) {
        this.cartService.expireCart(cart.id);
      }
    }
  }
}
