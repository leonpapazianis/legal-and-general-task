import { CartExpiryService } from './cart-expiry.service';
import { CartService } from './cart.service';
import { CartInMemoryRepository } from '../infrastructure/persistence/cart.in-memory.repository';
import { ProductsService } from '../../products/application/products.service';
import { ProductInMemoryRepository } from '../../products/infrastructure/persistence/product.in-memory.repository';
import { CartStatus } from '../domain/cart.entity';

const TTL_MS = 120_000;

const makeServices = () => {
  const productRepo = new ProductInMemoryRepository();
  const productsService = new ProductsService(productRepo);
  const cartRepo = new CartInMemoryRepository();
  const cartService = new CartService(cartRepo, productsService);
  const expiryService = new CartExpiryService(cartService);
  return { cartService, productsService, expiryService };
};

describe('CartExpiryService', () => {
  describe('sweep', () => {
    it('expires ACTIVE carts past the TTL and releases their reservations', () => {
      const { cartService, productsService, expiryService } = makeServices();
      const product = productsService.create({
        name: 'Widget',
        description: '',
        price: 9.99,
        stock: 10,
      });
      const cart = cartService.createCart();
      cartService.addItem(cart.id, product.id, 4);

      const liveCart = cartService.getCart(cart.id);
      liveCart.lastActivityAt = new Date(Date.now() - TTL_MS - 1000);
      cartService.persistCart(liveCart);

      expiryService.sweep(TTL_MS);

      expect(cartService.getCart(cart.id).status).toBe(CartStatus.EXPIRED);
      expect(productsService.findById(product.id).availableStock).toBe(10);
    });

    it('does not expire ACTIVE carts within the TTL', () => {
      const { cartService, productsService, expiryService } = makeServices();
      const product = productsService.create({
        name: 'Widget',
        description: '',
        price: 9.99,
        stock: 10,
      });
      const cart = cartService.createCart();
      cartService.addItem(cart.id, product.id, 2);

      expiryService.sweep(TTL_MS);

      expect(cartService.getCart(cart.id).status).toBe(CartStatus.ACTIVE);
      expect(productsService.findById(product.id).availableStock).toBe(8);
    });

    it('does not touch already CHECKED_OUT carts', () => {
      const { cartService, productsService, expiryService } = makeServices();
      const product = productsService.create({
        name: 'Widget',
        description: '',
        price: 9.99,
        stock: 10,
      });
      const cart = cartService.createCart();
      cartService.addItem(cart.id, product.id, 1);

      const liveCart = cartService.getCart(cart.id);
      liveCart.markCheckedOut();
      liveCart.lastActivityAt = new Date(Date.now() - TTL_MS - 1000);
      cartService.persistCart(liveCart);

      expiryService.sweep(TTL_MS);

      expect(cartService.getCart(cart.id).status).toBe(CartStatus.CHECKED_OUT);
    });
  });
});
