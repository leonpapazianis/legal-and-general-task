import { Cart, CartStatus } from '../../domain/cart.entity';
import { ICartRepository } from '../../domain/cart.repository.port';

export class CartInMemoryRepository implements ICartRepository {
  private readonly store = new Map<string, Cart>();

  findById(id: string): Cart | undefined {
    return this.store.get(id);
  }

  findAll(): Cart[] {
    return Array.from(this.store.values());
  }

  findByStatus(status: CartStatus): Cart[] {
    return this.findAll().filter(c => c.status === status);
  }

  save(cart: Cart): Cart {
    this.store.set(cart.id, cart);
    return cart;
  }
}
