import { randomUUID } from 'crypto';
import { DomainError } from '../../shared/domain/domain.error';

export enum DiscountType {
  PERCENTAGE_OFF_PRODUCT = 'PERCENTAGE_OFF_PRODUCT',
  FIXED_AMOUNT_OFF_PRODUCT = 'FIXED_AMOUNT_OFF_PRODUCT',
  BUY_X_GET_Y_FREE = 'BUY_X_GET_Y_FREE',
  CART_THRESHOLD_PERCENTAGE = 'CART_THRESHOLD_PERCENTAGE',
}

export interface PercentageOffProductConfig {
  productId: string;
  percentage: number;
}

export interface FixedAmountOffProductConfig {
  productId: string;
  amountOff: number;
}

export interface BuyXGetYFreeConfig {
  productId: string;
  buyQuantity: number;
  getFreeQuantity: number;
}

export interface CartThresholdPercentageConfig {
  thresholdAmount: number;
  percentage: number;
}

export type DiscountConfig =
  | PercentageOffProductConfig
  | FixedAmountOffProductConfig
  | BuyXGetYFreeConfig
  | CartThresholdPercentageConfig;

export interface CreateDiscountProps {
  name: string;
  type: DiscountType;
  config: DiscountConfig;
  isActive?: boolean;
}

export interface UpdateDiscountProps {
  name?: string;
  isActive?: boolean;
}

export class Discount {
  readonly id: string;
  name: string;
  readonly type: DiscountType;
  readonly config: DiscountConfig;
  isActive: boolean;
  readonly createdAt: Date;
  updatedAt: Date;

  private constructor(id: string, props: CreateDiscountProps) {
    this.id = id;
    this.name = props.name;
    this.type = props.type;
    this.config = props.config;
    this.isActive = props.isActive ?? true;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  static create(props: CreateDiscountProps): Discount {
    Discount.validateConfig(props.type, props.config);
    return new Discount(randomUUID(), props);
  }

  private static validateConfig(type: DiscountType, config: DiscountConfig): void {
    switch (type) {
      case DiscountType.PERCENTAGE_OFF_PRODUCT: {
        const c = config as PercentageOffProductConfig;
        if (!c.productId) throw new DomainError('productId is required');
        if (c.percentage <= 0 || c.percentage > 100)
          throw new DomainError('percentage must be between 1 and 100');
        break;
      }
      case DiscountType.FIXED_AMOUNT_OFF_PRODUCT: {
        const c = config as FixedAmountOffProductConfig;
        if (!c.productId) throw new DomainError('productId is required');
        if (c.amountOff <= 0) throw new DomainError('amountOff must be greater than zero');
        break;
      }
      case DiscountType.BUY_X_GET_Y_FREE: {
        const c = config as BuyXGetYFreeConfig;
        if (!c.productId) throw new DomainError('productId is required');
        if (c.buyQuantity < 1) throw new DomainError('buyQuantity must be at least 1');
        if (c.getFreeQuantity < 1) throw new DomainError('getFreeQuantity must be at least 1');
        break;
      }
      case DiscountType.CART_THRESHOLD_PERCENTAGE: {
        const c = config as CartThresholdPercentageConfig;
        if (c.thresholdAmount <= 0)
          throw new DomainError('thresholdAmount must be greater than zero');
        if (c.percentage <= 0 || c.percentage > 100)
          throw new DomainError('percentage must be between 1 and 100');
        break;
      }
    }
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  update(props: UpdateDiscountProps): void {
    if (props.name !== undefined) this.name = props.name;
    if (props.isActive !== undefined) {
      this.isActive = props.isActive;
    }
    this.updatedAt = new Date();
  }

  clone(): Discount {
    return Object.assign(Object.create(Discount.prototype) as Discount, {
      id: this.id,
      name: this.name,
      type: this.type,
      config: { ...this.config },
      isActive: this.isActive,
      createdAt: new Date(this.createdAt),
      updatedAt: new Date(this.updatedAt),
    });
  }
}
