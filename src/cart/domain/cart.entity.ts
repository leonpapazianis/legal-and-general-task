import { randomUUID } from 'crypto';
import { DomainError } from '../../shared/domain/domain.error';

export enum CartStatus {
  ACTIVE = 'ACTIVE',
  CHECKED_OUT = 'CHECKED_OUT',
  EXPIRED = 'EXPIRED',
}

export interface CartItem {
  readonly productId: string;
  readonly productName: string;
  quantity: number;
  readonly unitPrice: number;
}

export class Cart {
  readonly id: string;
  status: CartStatus;
  items: CartItem[];
  lastActivityAt: Date;
  readonly createdAt: Date;

  private constructor(id: string) {
    this.id = id;
    this.status = CartStatus.ACTIVE;
    this.items = [];
    this.lastActivityAt = new Date();
    this.createdAt = new Date();
  }

  static create(): Cart {
    return new Cart(randomUUID());
  }

  get subtotal(): number {
    return parseFloat(
      this.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0).toFixed(2),
    );
  }

  addItem(productId: string, productName: string, quantity: number, unitPrice: number): void {
    this.assertActive();
    const existing = this.items.find(i => i.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.push({ productId, productName, quantity, unitPrice });
    }
    this.lastActivityAt = new Date();
  }

  updateItemQuantity(productId: string, quantity: number): number {
    this.assertActive();
    const item = this.items.find(i => i.productId === productId);
    if (!item) throw new DomainError(`Product '${productId}' not in cart`);

    const delta = quantity - item.quantity;
    if (quantity === 0) {
      this.items = this.items.filter(i => i.productId !== productId);
    } else {
      item.quantity = quantity;
    }
    this.lastActivityAt = new Date();
    return delta;
  }

  removeItem(productId: string): number {
    this.assertActive();
    const item = this.items.find(i => i.productId === productId);
    if (!item) throw new DomainError(`Product '${productId}' not in cart`);
    this.items = this.items.filter(i => i.productId !== productId);
    this.lastActivityAt = new Date();
    return item.quantity;
  }

  isExpired(ttlMs: number): boolean {
    return Date.now() - this.lastActivityAt.getTime() >= ttlMs;
  }

  markCheckedOut(): void {
    this.status = CartStatus.CHECKED_OUT;
  }

  markExpired(): void {
    this.status = CartStatus.EXPIRED;
  }

  clone(): Cart {
    return Object.assign(Object.create(Cart.prototype) as Cart, {
      id: this.id,
      status: this.status,
      items: this.items.map((i) => ({ ...i })),
      lastActivityAt: new Date(this.lastActivityAt),
      createdAt: new Date(this.createdAt),
    });
  }

  private assertActive(): void {
    if (this.status === CartStatus.CHECKED_OUT) {
      throw new DomainError('Cart has already been checked out');
    }
    if (this.status === CartStatus.EXPIRED) {
      throw new DomainError('Cart has expired — please create a new cart');
    }
  }
}
