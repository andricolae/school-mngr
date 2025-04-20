import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { LoggingService } from './services/logging.service';
import { LogCategory } from './user.model';

@Injectable()
export class LoggingInterceptor implements HttpInterceptor {
  constructor(private logger: LoggingService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const skipLogging =
      request.url.includes('identitytoolkit.googleapis.com') ||
      request.url.includes('password');

    const startTime = Date.now();

    return next.handle(request).pipe(
      tap(event => {
        if (event instanceof HttpResponse && !skipLogging) {
          const duration = Date.now() - startTime;

          if (duration > 1000) {
            this.logger.logSystem(
              'SLOW_RESPONSE',
              `Slow API response: ${request.method} ${this.sanitizeUrl(request.url)} took ${duration}ms`,
              {
                url: this.sanitizeUrl(request.url),
                method: request.method,
                duration,
                status: event.status
              }
            );
          }
        }
      }),
      catchError((error: HttpErrorResponse) => {
        if (!skipLogging) {
          this.logger.logSystem(
            'API_ERROR',
            `API error: ${request.method} ${this.sanitizeUrl(request.url)} failed with status ${error.status}`,
            {
              url: this.sanitizeUrl(request.url),
              method: request.method,
              status: error.status,
              statusText: error.statusText,
              errorMessage: error.message
            }
          );
        }
        return throwError(() => error);
      })
    );
  }

  private sanitizeUrl(url: string): string {
    return url.split('?')[0];
  }
}
