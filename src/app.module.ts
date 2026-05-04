import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { DiscountsModule } from './discounts/discounts.module';
import { CartModule } from './cart/cart.module';

@Module({
  imports: [ProductsModule, DiscountsModule, CartModule],
})
export class AppModule {}
