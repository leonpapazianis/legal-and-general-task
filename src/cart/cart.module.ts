import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CartService } from './application/cart.service';
import { CheckoutService } from './application/checkout.service';
import { CartExpiryService } from './application/cart-expiry.service';
import { CartsController } from './infrastructure/http/carts.controller';
import { CartExpiryScheduler } from './infrastructure/schedulers/cart-expiry.scheduler';
import { CartInMemoryRepository } from './infrastructure/persistence/cart.in-memory.repository';
import { CART_REPOSITORY } from './domain/cart.repository.port';
import { ProductsModule } from '../products/products.module';
import { DiscountsModule } from '../discounts/discounts.module';

@Module({
  imports: [ScheduleModule.forRoot(), ProductsModule, DiscountsModule],
  controllers: [CartsController],
  providers: [
    CartService,
    CheckoutService,
    CartExpiryService,
    CartExpiryScheduler,
    { provide: CART_REPOSITORY, useClass: CartInMemoryRepository },
  ],
  exports: [CartService, CheckoutService],
})
export class CartModule {}
