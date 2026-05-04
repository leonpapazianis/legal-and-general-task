import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { CartExpiryService, CART_TTL_MS } from '../../application/cart-expiry.service';

@Injectable()
export class CartExpiryScheduler {
  constructor(private readonly cartExpiryService: CartExpiryService) {}

  @Interval(30_000)
  handleExpiry(): void {
    this.cartExpiryService.sweep(CART_TTL_MS);
  }
}
