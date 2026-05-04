import { NotFoundException, ConflictException, UnprocessableEntityException } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartInMemoryRepository } from '../infrastructure/persistence/cart.in-memory.repository';
import { ProductsService } from '../../products/application/products.service';
import { ProductInMemoryRepository } from '../../products/infrastructure/persistence/product.in-memory.repository';
import { CartStatus } from '../domain/cart.entity';

const makeServices = () => {
  const productRepo = new ProductInMemoryRepository();
  const productsService = new ProductsService(productRepo);
  const cartService = new CartService(new CartInMemoryRepository(), productsService);
  return { cartService, productsService };
};

const seedProduct = (productsService: ProductsService, stock = 10, price = 9.99) =>
  productsService.create({ name: 'Widget', description: '', price, stock });

describe('CartService', () => {
  describe('createCart', () => {
    it('returns an ACTIVE cart with no items', () => {
      const { cartService } = makeServices();
      const cart = cartService.createCart();
      expect(cart.id).toBeDefined();
      expect(cart.status).toBe(CartStatus.ACTIVE);
      expect(cart.items).toHaveLength(0);
    });
  });

  describe('getCart', () => {
    it('returns the cart by id', () => {
      const { cartService } = makeServices();
      const created = cartService.createCart();
      expect(cartService.getCart(created.id).id).toBe(created.id);
    });

    it('throws NotFoundException for unknown id', () => {
      const { cartService } = makeServices();
      expect(() => cartService.getCart('unknown')).toThrow(NotFoundException);
    });
  });

  describe('addItem', () => {
    it('adds an item and reserves stock on the product', () => {
      const { cartService, productsService } = makeServices();
      const product = seedProduct(productsService, 10);
      const cart = cartService.createCart();

      cartService.addItem(cart.id, product.id, 3);

      expect(cartService.getCart(cart.id).items).toHaveLength(1);
      expect(productsService.findById(product.id).availableStock).toBe(7);
    });

    it('merges quantity when the same product is added twice', () => {
      const { cartService, productsService } = makeServices();
      const product = seedProduct(productsService, 10);
      const cart = cartService.createCart();

      cartService.addItem(cart.id, product.id, 2);
      cartService.addItem(cart.id, product.id, 3);

      expect(cartService.getCart(cart.id).items[0].quantity).toBe(5);
      expect(productsService.findById(product.id).availableStock).toBe(5);
    });

    it('throws UnprocessableEntityException when stock is insufficient', () => {
      const { cartService, productsService } = makeServices();
      const product = seedProduct(productsService, 2);
      const cart = cartService.createCart();

      expect(() => cartService.addItem(cart.id, product.id, 5)).toThrow(UnprocessableEntityException);
    });

    it('throws NotFoundException for unknown cart', () => {
      const { cartService, productsService } = makeServices();
      const product = seedProduct(productsService);
      expect(() => cartService.addItem('unknown', product.id, 1)).toThrow(NotFoundException);
    });

    it('throws ConflictException when cart is not ACTIVE', () => {
      const { cartService, productsService } = makeServices();
      const product = seedProduct(productsService, 10);
      const cart = cartService.createCart();
      cartService.addItem(cart.id, product.id, 1);
      cartService.getCart(cart.id).markCheckedOut();
      expect(() => cartService.addItem(cart.id, product.id, 1)).toThrow(ConflictException);
    });
  });

  describe('updateItemQuantity', () => {
    it('increases quantity and reserves the additional stock', () => {
      const { cartService, productsService } = makeServices();
      const product = seedProduct(productsService, 10);
      const cart = cartService.createCart();
      cartService.addItem(cart.id, product.id, 2);

      cartService.updateItemQuantity(cart.id, product.id, 5);

      expect(cartService.getCart(cart.id).items[0].quantity).toBe(5);
      expect(productsService.findById(product.id).availableStock).toBe(5);
    });

    it('decreases quantity and releases the excess reservation', () => {
      const { cartService, productsService } = makeServices();
      const product = seedProduct(productsService, 10);
      const cart = cartService.createCart();
      cartService.addItem(cart.id, product.id, 5);

      cartService.updateItemQuantity(cart.id, product.id, 2);

      expect(cartService.getCart(cart.id).items[0].quantity).toBe(2);
      expect(productsService.findById(product.id).availableStock).toBe(8);
    });

    it('removes the item and fully releases stock when quantity is set to 0', () => {
      const { cartService, productsService } = makeServices();
      const product = seedProduct(productsService, 10);
      const cart = cartService.createCart();
      cartService.addItem(cart.id, product.id, 3);

      cartService.updateItemQuantity(cart.id, product.id, 0);

      expect(cartService.getCart(cart.id).items).toHaveLength(0);
      expect(productsService.findById(product.id).availableStock).toBe(10);
    });

    it('throws NotFoundException when product is not in cart', () => {
      const { cartService } = makeServices();
      const cart = cartService.createCart();
      expect(() => cartService.updateItemQuantity(cart.id, 'unknown', 1)).toThrow(NotFoundException);
    });
  });

  describe('removeItem', () => {
    it('removes the item and releases the reservation', () => {
      const { cartService, productsService } = makeServices();
      const product = seedProduct(productsService, 10);
      const cart = cartService.createCart();
      cartService.addItem(cart.id, product.id, 4);

      cartService.removeItem(cart.id, product.id);

      expect(cartService.getCart(cart.id).items).toHaveLength(0);
      expect(productsService.findById(product.id).availableStock).toBe(10);
    });

    it('throws NotFoundException when product is not in cart', () => {
      const { cartService } = makeServices();
      const cart = cartService.createCart();
      expect(() => cartService.removeItem(cart.id, 'unknown')).toThrow(NotFoundException);
    });
  });

  describe('expireCart', () => {
    it('marks cart EXPIRED and releases all reservations', () => {
      const { cartService, productsService } = makeServices();
      const product = seedProduct(productsService, 10);
      const cart = cartService.createCart();
      cartService.addItem(cart.id, product.id, 4);

      cartService.expireCart(cart.id);

      expect(cartService.getCart(cart.id).status).toBe(CartStatus.EXPIRED);
      expect(productsService.findById(product.id).availableStock).toBe(10);
    });
  });
});
