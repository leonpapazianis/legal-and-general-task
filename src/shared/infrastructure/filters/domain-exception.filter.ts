import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import {
  CartNotActiveError,
  DomainError,
  EntityNotFoundError,
  InvariantViolationError,
  StockUnavailableError,
} from '../../domain/domain.error';

function statusFor(err: DomainError): number {
  if (err instanceof EntityNotFoundError) return HttpStatus.NOT_FOUND;
  if (err instanceof CartNotActiveError) return HttpStatus.CONFLICT;
  if (err instanceof StockUnavailableError) return HttpStatus.UNPROCESSABLE_ENTITY;
  if (err instanceof InvariantViolationError) return HttpStatus.UNPROCESSABLE_ENTITY;
  return HttpStatus.BAD_REQUEST;
}

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = statusFor(exception);

    response.status(status).json({
      statusCode: status,
      error: exception.name,
      message: exception.message,
    });
  }
}
