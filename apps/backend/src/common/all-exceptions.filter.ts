import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/** Widened to `number` so comparing it against a plain status code is not an
 *  unsafe enum comparison. */
const SERVER_ERROR_THRESHOLD: number = HttpStatus.INTERNAL_SERVER_ERROR;

interface ErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  requestId?: string;
  timestamp: string;
}

/**
 * Single exit point for every error leaving the API.
 *
 * Without it Nest renders unhandled exceptions as a bare 500 with no log line
 * and no correlation id, and any non-HttpException (a driver error, say) can
 * put its raw message - which may quote a connection string - into the
 * response body.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const body: ErrorBody = {
      statusCode: status,
      error: isHttp ? exception.name : 'InternalServerError',
      // Only HttpExceptions carry a message that is safe to show a client.
      // Everything else is summarised, and the detail goes to the log instead.
      message: isHttp ? extractMessage(exception) : 'Internal server error',
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    const requestId = request.id;
    if (typeof requestId === 'string') body.requestId = requestId;

    if (status >= SERVER_ERROR_THRESHOLD) {
      this.logger.error(
        `${request.method} ${request.url} -> ${String(status)}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} -> ${String(status)}`);
    }

    response.status(status).json(body);
  }
}

function extractMessage(exception: HttpException): string | string[] {
  const payload = exception.getResponse();
  if (typeof payload === 'string') return payload;
  if (typeof payload === 'object' && payload !== null && 'message' in payload) {
    const { message } = payload;
    if (typeof message === 'string' || Array.isArray(message)) {
      return message as string | string[];
    }
  }
  return exception.message;
}
