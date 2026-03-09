#!/bin/bash
find src/app/api/v1/projects -type f -name route.ts -exec sed -i 's/session.user.role/((session.user as any).role)/g' {} +
sed -i 's/session.user.id/session.user!.id/g' src/app/api/v1/specs/\[id\]/versions/route.ts
