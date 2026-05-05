export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class EntityNotFoundError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'EntityNotFoundError';
  }
}

export class CartNotActiveError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'CartNotActiveError';
  }
}

export class StockUnavailableError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'StockUnavailableError';
  }
}

export class InvariantViolationError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'InvariantViolationError';
  }
}
