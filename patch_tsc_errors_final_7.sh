sed -i 's/createdBy: u1.id/createdByUserId: u1.id/g' db/seed.ts
sed -i 's/createdBy: u2.id/createdByUserId: u2.id/g' db/seed.ts
sed -i 's/createdByUserId/createdBy/g' db/seed.ts
sed -i 's/user.username/user.email/g' src/app/api/v1/auth/signup/route.ts
sed -i 's/project.state/project.description/g' src/app/api/v1/projects/route.ts
sed -i 's/"paused"/"failed"/g' src/app/api/tasks/[id]/route.ts
sed -i "s/'paused'/'failed'/g" src/app/api/tasks/[id]/route.ts
