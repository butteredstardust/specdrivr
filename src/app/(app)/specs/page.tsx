import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { authInstance } from '@/lib/auth';
import { projectRepository } from '@/repositories/project-repository';
import { getEnrichedSpecs } from '@/queries/specs-query';
import { SpecsClient, type Spec } from './specs-client';

export default async function SpecsPage() {
  const session = await authInstance.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect('/login');
  }

  const projects = await projectRepository.getByUserId(session.user.id);
  const cookieStore = await cookies();
  const activeProjectIdStr = cookieStore.get('active-project-id')?.value;

  let validatedProjectId: number | null = null;
  if (activeProjectIdStr) {
    const id = parseInt(activeProjectIdStr, 10);
    if (projects.some((p) => p.id === id)) {
      validatedProjectId = id;
    }
  }

  if (validatedProjectId === null && projects.length > 0) {
    validatedProjectId = projects[0].id;
  }

  let initialSpecs: Spec[] = [];

  if (validatedProjectId) {
    const { data } = await getEnrichedSpecs({
      projectId: validatedProjectId,
      limit: 50, // Match the client-side default limit
    });

    // Serialize dates for client component
    initialSpecs = data.map((spec) => ({
      ...spec,
      createdAt: spec.createdAt.toISOString(),
      updatedAt: spec.updatedAt.toISOString(),
    })) as unknown as Spec[];
  }

  return <SpecsClient initialSpecs={initialSpecs} />;
}
