import { projectRepository } from '@/repositories/project-repository';

export default async function HomePage() {
  const allProjects = await projectRepository.getAll();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Specdrivr</h1>
        <p className="text-muted-foreground mb-8">
          Simple project viewer - data loaded from database
        </p>

        <div className="grid gap-4">
          <h2 className="text-xl font-semibold">Projects</h2>
          {allProjects.length === 0 ? (
            <p className="text-muted-foreground">No projects found</p>
          ) : (
            <ul className="space-y-3">
              {allProjects.map((project) => (
                <li
                  key={project.id}
                  className="p-4 rounded-lg border bg-card text-card-foreground"
                >
                  <h3 className="font-semibold">{project.name}</h3>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-12 grid gap-4">
          <h2 className="text-xl font-semibold">Interactive Demo</h2>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter some text..."
              className="flex-1 px-3 py-2 rounded-md border bg-background text-foreground"
            />
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
              Click Me
            </button>
          </div>

          <p className="text-sm text-muted-foreground">
            This is a placeholder for future interactivity
          </p>
        </div>
      </div>
    </div>
  );
}
