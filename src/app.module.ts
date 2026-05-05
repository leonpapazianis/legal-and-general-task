import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ProductsModule } from './products/products.module';
import { DiscountsModule } from './discounts/discounts.module';
import { CartModule } from './cart/cart.module';
import { DomainExceptionFilter } from './shared/infrastructure/filters/domain-exception.filter';

@Module({
  imports: [ProductsModule, DiscountsModule, CartModule],
  providers: [{ provide: APP_FILTER, useClass: DomainExceptionFilter }],
})
export class AppModule {}
