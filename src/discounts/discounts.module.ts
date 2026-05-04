import { Module } from '@nestjs/common';
import { DiscountsController } from './infrastructure/http/discounts.controller';
import { DiscountsService } from './application/discounts.service';
import { DiscountInMemoryRepository } from './infrastructure/persistence/discount.in-memory.repository';
import { DISCOUNT_REPOSITORY } from './domain/discount.repository.port';
import { DiscountEngineService, DISCOUNT_STRATEGIES } from './domain/discount-engine.service';
import { PercentageOffProductStrategy } from './domain/strategies/percentage-off-product.strategy';
import { FixedAmountOffProductStrategy } from './domain/strategies/fixed-amount-off-product.strategy';
import { BuyXGetYFreeStrategy } from './domain/strategies/buy-x-get-y-free.strategy';
import { CartThresholdPercentageStrategy } from './domain/strategies/cart-threshold-percentage.strategy';

const strategyProviders = [
  PercentageOffProductStrategy,
  FixedAmountOffProductStrategy,
  BuyXGetYFreeStrategy,
  CartThresholdPercentageStrategy,
];

@Module({
  controllers: [DiscountsController],
  providers: [
    DiscountsService,
    { provide: DISCOUNT_REPOSITORY, useClass: DiscountInMemoryRepository },
    ...strategyProviders,
    {
      provide: DISCOUNT_STRATEGIES,
      useFactory: (...strategies: InstanceType<(typeof strategyProviders)[number]>[]) => strategies,
      inject: strategyProviders,
    },
    DiscountEngineService,
  ],
  exports: [DiscountsService, DiscountEngineService],
})
export class DiscountsModule {}
