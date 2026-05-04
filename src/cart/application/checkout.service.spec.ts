import { ConflictException } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CartService } from './cart.service';
import { CartInMemoryRepository } from '../infrastructure/persistence/cart.in-memory.repository';
import { ProductsService } from '../../products/application/products.service';
import { ProductInMemoryRepository } from '../../products/infrastructure/persistence/product.in-memory.repository';
import { DiscountEngineService } from '../../discounts/domain/discount-engine.service';
import { DiscountsService } from '../../discounts/application/discounts.service';
import { DiscountInMemoryRepository } from '../../discounts/infrastructure/persistence/discount.in-memory.repository';
import { CartStatus } from '../domain/cart.entity';
import { PercentageOffProductStrategy } from '../../discounts/domain/strategies/percentage-off-product.strategy';
import { FixedAmountOffProductStrategy } from '../../discounts/domain/strategies/fixed-amount-off-product.strategy';
import { BuyXGetYFreeStrategy } from '../../discounts/domain/strategies/buy-x-get-y-free.strategy';
import { CartThresholdPercentageStrategy } from '../../discounts/domain/strategies/cart-threshold-percentage.strategy';

const makeServices = () => {
  const productRepo = new ProductInMemoryRepository();
  const productsService = new ProductsService(productRepo);
  const cartRepo = new CartInMemoryRepository();
  const cartService = new CartService(cartRepo, productsService);
  const discountRepo = new DiscountInMemoryRepository();
  const discountsService = new DiscountsService(discountRepo);
  const strategies = [
    new PercentageOffProductStrategy(),
    new FixedAmountOffProductStrategy(),
    new BuyXGetYFreeStrategy(),
    new CartThresholdPercentageStrategy(),
  ];
  const discountEngine = new DiscountEngineService(strategies);
  const checkoutService = new CheckoutService(
    cartService,
    productsService,
    discountsService,
    discountEngine,
  );
  return { cartService, productsService, discountsService, checkoutService };
};

describe('CheckoutService', () => {
  describe('checkout', () => {
    it('commits stock, marks cart CHECKED_OUT, returns result with subtotal and total', () => {
      const { cartService, productsService, checkoutService } = makeServices();
      const product = productsService.create({
        name: 'Widget',
        description: '',
        price: 10,
        stock: 10,
      });
      const cart = cartService.createCart();
      cartService.addItem(cart.id, product.id, 3);

      const result = checkoutService.checkout(cart.id);

      expect(cartService.getCart(cart.id).status).toBe(CartStatus.CHECKED_OUT);
      expect(productsService.findById(product.id).stock).toBe(7);
      expect(productsService.findById(product.id).reserved).toBe(0);
      expect(result.subtotal).toBe(30);
      expect(result.total).toBe(30);
      expect(result.discounts.lines).toHaveLength(0);
    });

    it('applies active discounts and returns reduced total', () => {
      const { cartService, productsService, discountsService, checkoutService } = makeServices();
      const product = productsService.create({
        name: 'Widget',
        description: '',
        price: 10,
        stock: 10,
      });
      discountsService.create({
        name: '10% off Widget',
        type: 'PERCENTAGE_OFF_PRODUCT' as any,
        config: { productId: product.id, percentage: 10 },
        isActive: true,
      });
      const cart = cartService.createCart();
      cartService.addItem(cart.id, product.id, 2);

      const result = checkoutService.checkout(cart.id);

      expect(result.subtotal).toBe(20);
      expect(result.total).toBe(18);
      expect(result.discounts.totalDiscount).toBe(2);
    });

    it('throws ConflictException when cart is already CHECKED_OUT', () => {
      const { cartService, productsService, checkoutService } = makeServices();
      const product = productsService.create({
        name: 'Widget',
        description: '',
        price: 10,
        stock: 10,
      });
      const cart = cartService.createCart();
      cartService.addItem(cart.id, product.id, 1);
      checkoutService.checkout(cart.id);

      expect(() => checkoutService.checkout(cart.id)).toThrow(ConflictException);
    });

    it('throws ConflictException when cart is EXPIRED', () => {
      const { cartService, productsService, checkoutService } = makeServices();
      const product = productsService.create({
        name: 'Widget',
        description: '',
        price: 10,
        stock: 10,
      });
      const cart = cartService.createCart();
      cartService.addItem(cart.id, product.id, 1);
      cartService.expireCart(cart.id);

      expect(() => checkoutService.checkout(cart.id)).toThrow(ConflictException);
    });
  });
});
