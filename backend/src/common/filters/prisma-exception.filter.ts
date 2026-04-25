import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // Handle common Prisma error codes
    switch (exception.code) {
      case 'P2002': // Unique constraint violation
        status = HttpStatus.CONFLICT;
        message = `Unique constraint failed on ${exception.meta?.target}`;
        break;
      case 'P2003': // Foreign key constraint violation
        status = HttpStatus.BAD_REQUEST;
        message = `Foreign key constraint failed on ${exception.meta?.field_name}`;
        break;
      case 'P2025': // Record not found
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        break;
      default:
        status = HttpStatus.BAD_REQUEST;
        message = exception.message;
        break;
    }

    response.status(status).json({
      statusCode: status,
      message: message,
      error: 'Bad Request',
      timestamp: new Date().toISOString(),
    });
  }
}
