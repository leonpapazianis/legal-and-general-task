import {
  DomainError,
  EntityNotFoundError,
  CartNotActiveError,
  StockUnavailableError,
  InvariantViolationError,
} from './domain.error';

describe('DomainError subclasses', () => {
  it('EntityNotFoundError is a DomainError', () => {
    const err = new EntityNotFoundError('Product not found');
    expect(err).toBeInstanceOf(DomainError);
    expect(err).toBeInstanceOf(EntityNotFoundError);
    expect(err.message).toBe('Product not found');
    expect(err.name).toBe('EntityNotFoundError');
  });

  it('CartNotActiveError is a DomainError', () => {
    const err = new CartNotActiveError('Cart has already been checked out');
    expect(err).toBeInstanceOf(DomainError);
    expect(err).toBeInstanceOf(CartNotActiveError);
    expect(err.name).toBe('CartNotActiveError');
  });

  it('StockUnavailableError is a DomainError', () => {
    const err = new StockUnavailableError('Insufficient stock');
    expect(err).toBeInstanceOf(DomainError);
    expect(err).toBeInstanceOf(StockUnavailableError);
    expect(err.name).toBe('StockUnavailableError');
  });

  it('InvariantViolationError is a DomainError', () => {
    const err = new InvariantViolationError('Price must be positive');
    expect(err).toBeInstanceOf(DomainError);
    expect(err).toBeInstanceOf(InvariantViolationError);
    expect(err.name).toBe('InvariantViolationError');
  });

  it('subclasses are distinguishable from each other', () => {
    const notFound = new EntityNotFoundError('x');
    const notActive = new CartNotActiveError('x');
    expect(notFound).not.toBeInstanceOf(CartNotActiveError);
    expect(notActive).not.toBeInstanceOf(EntityNotFoundError);
  });
});
