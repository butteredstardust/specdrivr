sed -i 's/users.username/users.email/g' src/lib/auth.ts
sed -i 's/user.username/user.email/g' src/lib/auth.ts
sed -i 's/username:/email:/g' src/lib/auth.ts

sed -i 's/createdByUserId/createdBy/g' src/app/api/v1/projects/route.ts
sed -i 's/createdByUserId/createdBy/g' src/repositories/project-repository.ts

sed -i 's/spec.content/spec.markdownContent/g' src/app/api/v1/specs/[id]/versions/[vId]/route.ts
sed -i 's/version.content/version.markdownContent/g' src/app/api/v1/specs/[id]/versions/[vId]/route.ts
