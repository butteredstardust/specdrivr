sed -i 's/createdByUserId: u1.id/createdBy: u1.id/g' db/seed.ts
sed -i 's/createdByUserId: u2.id/createdBy: u2.id/g' db/seed.ts

sed -i 's/createdByUserId/createdBy/g' src/app/api/projects/route.ts
sed -i 's/"paused"/"failed"/g' src/app/api/tasks/[id]/route.ts

sed -i 's/email: invite.email,/name: parsed.data.name || invite.email.split("@")[0],\n          email: invite.email,/g' src/app/api/auth/accept-invite/route.ts
sed -i 's/email: email,/name: email.split("@")[0],\n          email: email,/g' src/app/api/v1/auth/signup/route.ts
sed -i 's/user.username/user.email/g' src/app/api/v1/auth/signup/route.ts

sed -i 's/project.state/project.description/g' src/app/api/v1/projects/route.ts
