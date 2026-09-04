import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/rbac';

const ALLOWED_PROVIDERS = new Set(['github.com', 'gitlab.com']);

/**
 * GET /api/v1/verify-repo?projectId=<id>&url=<encoded-url>
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
  const projectId = Number(searchParams.get('projectId'));

  if (!Number.isInteger(projectId) || projectId <= 0) {
    return NextResponse.json(
      { error: { code: 'INVALID_PROJECT', message: 'A valid projectId is required' } },
      { status: 422 }
    );
  }

  const { allowed } = await requireAdmin(session.user.id, projectId);
  if (!allowed) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Project admin access is required' } },
      { status: 403 }
    );
  }

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

  if (
    parsed.protocol !== 'https:' ||
    parsed.port !== '' ||
    parsed.username !== '' ||
    parsed.password !== '' ||
    !ALLOWED_PROVIDERS.has(parsed.hostname.toLowerCase()) ||
    parsed.pathname.split('/').filter(Boolean).length < 2
  ) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_URL',
          message: 'url must be an HTTPS GitHub or GitLab repository URL',
        },
      },
      { status: 422 }
    );
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      method: 'HEAD',
      redirect: 'manual',
      signal: AbortSignal.timeout(8000),
    });

    const reachable = upstream.status >= 200 && upstream.status < 300;
    if (reachable) {
      return NextResponse.json({ data: { reachable: true, status: upstream.status } });
    }

    return NextResponse.json(
      { error: { code: 'UPSTREAM_ERROR', message: `Upstream returned ${upstream.status}` } },
      { status: 502 }
    );
  } catch (err) {
    logger.warn({ err, provider: parsed.hostname }, 'verify-repo: upstream unreachable');
    return NextResponse.json(
      { error: { code: 'UNREACHABLE', message: 'Repository URL is unreachable' } },
      { status: 502 }
    );
  }
}
