import { Module } from '@nestjs/common';
import { ProductsController } from './infrastructure/http/products.controller';
import { ProductsService } from './application/products.service';
import { ProductInMemoryRepository } from './infrastructure/persistence/product.in-memory.repository';
import { PRODUCT_REPOSITORY } from './domain/product.repository.port';

@Module({
  controllers: [ProductsController],
  providers: [
    ProductsService,
    { provide: PRODUCT_REPOSITORY, useClass: ProductInMemoryRepository },
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
