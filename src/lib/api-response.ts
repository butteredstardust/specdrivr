/**
 * API Response Utility
 *
 * Provides consistent response formatting for all API routes.
 *
 * Usage:
 * ```typescript
 * import { apiSuccess, apiError } from '@/lib/api-response';
 *
 * return apiSuccess(data); // { success: true, data }
 * return apiSuccess(data, 201); // { success: true, data } with 201 status
 * return apiError('UNAUTHORIZED', 'Unauthorized', 401);
 * return apiError('VALIDATION_ERROR', 'Invalid input', 400, details);
 * ```
 */

import { NextResponse } from 'next/server';

export type ApiSuccess<T> = { success: true; data: T };

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data } as const, { status });
}

export function apiError(
  code: string,
  message: string,
  status = 500,
  details?: unknown
): NextResponse<ApiError> {
  return NextResponse.json({ success: false, error: { code, message, details } } as const, {
    status,
  });
}
