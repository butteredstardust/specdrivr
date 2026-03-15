import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';

/**
 * GET /api/v1/verify-repo?url=<encoded-url>
 *
 * Server-side proxy that performs a HEAD request against the given repository
 * URL. This avoids browser CORS restrictions when checking repo reachability.
 *
 * Returns 200 if the upstream responds with 200/301/302/307/308.
 * Returns 422 if the URL param is missing or not a valid http(s) URL.
 * Returns 502 if the upstream is unreachable or returns a non-redirect error.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('url');

  if (!raw) {
    return NextResponse.json(
      { error: { code: 'MISSING_PARAM', message: 'url query parameter is required' } },
      { status: 422 }
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_URL', message: 'url must be a valid absolute URL' } },
      { status: 422 }
    );
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return NextResponse.json(
      { error: { code: 'INVALID_URL', message: 'url must use http or https protocol' } },
      { status: 422 }
    );
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });

    const reachable = upstream.status < 400;
    if (reachable) {
      return NextResponse.json({ data: { reachable: true, status: upstream.status } });
    }

    return NextResponse.json(
      { error: { code: 'UPSTREAM_ERROR', message: `Upstream returned ${upstream.status}` } },
      { status: 502 }
    );
  } catch (err) {
    logger.warn({ err, url: parsed.toString() }, 'verify-repo: upstream unreachable');
    return NextResponse.json(
      { error: { code: 'UNREACHABLE', message: 'Repository URL is unreachable' } },
      { status: 502 }
    );
  }
}
