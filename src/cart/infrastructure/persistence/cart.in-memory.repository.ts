import { Cart, CartStatus } from '../../domain/cart.entity';
import { ICartRepository } from '../../domain/cart.repository.port';

export class CartInMemoryRepository implements ICartRepository {
  private readonly store = new Map<string, Cart>();

  findById(id: string): Cart | undefined {
    return this.store.get(id)?.clone();
  }

  findAll(): Cart[] {
    return Array.from(this.store.values()).map((c) => c.clone());
  }

  findByStatus(status: CartStatus): Cart[] {
    return this.findAll().filter((c) => c.status === status);
  }

  save(cart: Cart): Cart {
    this.store.set(cart.id, cart.clone());
    return cart;
  }
}
