import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../../logger/createChildLogger';
import { Profiler } from 'winston';

@Injectable()
export class RouteLogger implements NestInterceptor {
  private readonly _logger: Logger = createChildLogger(this);

  public intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<void> {
    const profiler: Profiler = this._logger.startTimer();
    const req: Request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap((): void => {
        profiler.done({
          message: `${req.method} ${req.originalUrl}`,
          level: 'http',
        });
      }),
    );
  }
}
