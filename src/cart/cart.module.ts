import { Module } from '@nestjs/common';
import { CartService } from './application/cart.service';
import { CartsController } from './infrastructure/http/carts.controller';
import { CartInMemoryRepository } from './infrastructure/persistence/cart.in-memory.repository';
import { CART_REPOSITORY } from './domain/cart.repository.port';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [ProductsModule],
  controllers: [CartsController],
  providers: [
    CartService,
    { provide: CART_REPOSITORY, useClass: CartInMemoryRepository },
  ],
  exports: [CartService],
})
export class CartModule {}
