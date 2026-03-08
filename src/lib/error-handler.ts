import { NextResponse } from 'next/server';
import {
  AppError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from './errors';

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    details?: unknown;
  };
}

function getErrorCode(error: AppError): string {
  if (error instanceof DatabaseError) {
    return 'DATABASE_ERROR';
  }
  if (error instanceof NotFoundError) {
    return 'NOT_FOUND';
  }
  if (error instanceof ValidationError) {
    return 'VALIDATION_ERROR';
  }
  return 'INTERNAL_ERROR';
}

export function formatErrorResponse(error: unknown): ErrorResponse {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: getErrorCode(error),
        statusCode: error.statusCode,
        details: error instanceof ValidationError ? error.details : undefined,
      },
    };
  }

  if (error instanceof Error) {
    console.error('Unexpected error:', error);

    return {
      success: false,
      error: {
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
      },
    };
  }

  return {
    success: false,
    error: {
      message: 'An unknown error occurred',
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
    },
  };
}

export function handleApiError(error: unknown) {
  return NextResponse.json(formatErrorResponse(error), {
    status: (error instanceof AppError) ? error.statusCode : 500,
  });
}

export function createErrorHandler() {
  return {
    onError: (error: unknown) => {
      if (error instanceof AppError) {
        if (error.isOperational) {
          console.error(`Operational error: ${error.name} - ${error.message}`);
        } else {
          console.error(`Programming error: ${error.name} - ${error.message}`);
        }
      } else {
        console.error('Unexpected error:', error);
      }
    },
  };
}
