import { Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

/** Sentry SDK is optional — only imported if available at runtime. */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Sentry: { captureException?: (e: unknown) => void } = (() => {
  try { return require('@sentry/node'); } catch { return {}; }
})();

@Catch()
export class SentryFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= 500 && Sentry.captureException) {
      Sentry.captureException(exception);
    }

    super.catch(exception, host);
  }
}
