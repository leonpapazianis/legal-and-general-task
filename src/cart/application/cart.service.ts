import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { Cart, CartStatus } from '../domain/cart.entity';
import type { ICartRepository } from '../domain/cart.repository.port';
import { CART_REPOSITORY } from '../domain/cart.repository.port';
import { ProductsService } from '../../products/application/products.service';
import { DomainError } from '../../shared/domain/domain.error';

@Injectable()
export class CartService {
  constructor(
    @Inject(CART_REPOSITORY) private readonly repo: ICartRepository,
    private readonly productsService: ProductsService,
  ) {}

  createCart(): Cart {
    return this.repo.save(Cart.create());
  }

  getCart(id: string): Cart {
    const cart = this.repo.findById(id);
    if (!cart) throw new NotFoundException(`Cart '${id}' not found`);
    return cart;
  }

  addItem(cartId: string, productId: string, quantity: number): Cart {
    const cart = this.getCart(cartId);
    if (cart.status !== CartStatus.ACTIVE) {
      throw new ConflictException('Cart is not active');
    }
    const product = this.productsService.findById(productId);
    this.productsService.reserve(productId, quantity);
    try {
      cart.addItem(productId, product.name, quantity, product.price);
    } catch (err) {
      this.productsService.release(productId, quantity);
      if (err instanceof DomainError) throw new ConflictException(err.message);
      throw err;
    }
    return this.repo.save(cart);
  }

  updateItemQuantity(cartId: string, productId: string, quantity: number): Cart {
    const cart = this.getCart(cartId);
    let delta: number;
    try {
      delta = cart.updateItemQuantity(productId, quantity);
    } catch (err) {
      if (err instanceof DomainError) throw new NotFoundException(err.message);
      throw err;
    }
    if (delta > 0) {
      this.productsService.reserve(productId, delta);
    } else if (delta < 0) {
      this.productsService.release(productId, -delta);
    }
    return this.repo.save(cart);
  }

  removeItem(cartId: string, productId: string): Cart {
    const cart = this.getCart(cartId);
    let qty: number;
    try {
      qty = cart.removeItem(productId);
    } catch (err) {
      if (err instanceof DomainError) throw new NotFoundException(err.message);
      throw err;
    }
    this.productsService.release(productId, qty);
    return this.repo.save(cart);
  }

  expireCart(cartId: string): Cart {
    const cart = this.getCart(cartId);
    for (const item of cart.items) {
      this.productsService.release(item.productId, item.quantity);
    }
    cart.markExpired();
    return this.repo.save(cart);
  }
}
