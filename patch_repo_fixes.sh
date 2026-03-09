sed -i "s/'developer'/'member'/g" src/app/api/v1/projects/[id]/members/[userId]/route.ts
sed -i "s/createdByUserId/createdBy/g" src/app/api/v1/projects/[id]/members/[userId]/route.ts
sed -i "s/project.state/project.description/g" src/app/api/v1/projects/route.ts
sed -i "s/users.username/users.email/g" src/app/api/v1/projects/[id]/members/route.ts
sed -i '/createdBy:/d' src/app/api/v1/projects/route.ts

sed -i "s/read: true/readAt: new Date()/g" src/app/api/v1/notifications/[id]/read/route.ts
sed -i "s/read: true/readAt: new Date()/g" src/app/api/v1/notifications/read-all/route.ts

sed -i 's/export type Project = typeof projects.$inferSelect;/export type Project = typeof projects.$inferSelect;\n/g' src/repositories/project-repository.ts
sed -i 's/return result as unknown as Project\[\];/return (result as unknown) as Project\[\];/g' src/repositories/project-repository.ts
sed -i 's/return result\[0\] as unknown as Project || null;/return (result\[0\] as unknown as Project) || null;/g' src/repositories/project-repository.ts
sed -i 's/return project as unknown as Project;/return (project as unknown) as Project;/g' src/repositories/project-repository.ts
sed -i 's/return updatedProject as unknown as Project;/return (updatedProject as unknown) as Project;/g' src/repositories/project-repository.ts
