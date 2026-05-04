import { Cart, CartStatus } from './cart.entity';

export const CART_REPOSITORY = Symbol('ICartRepository');

export interface ICartRepository {
  findById(id: string): Cart | undefined;
  findAll(): Cart[];
  findByStatus(status: CartStatus): Cart[];
  save(cart: Cart): Cart;
}
